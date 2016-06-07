var
    _ = require('underscore'),
    auth = require('app/auth'),
    config = require('config'),
    common = require('app/services/common'),
    BoLogger = require('app/bologger'),
    Organization = require('app/models/organizations'),
    bologger = new BoLogger(),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    Project = require('app/models/projects'),
    Workflow = require('app/models/workflows'),
    EssenceRole = require('app/models/essence_roles'),
    WorkflowStep = require('app/models/workflow_steps'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Comment = require('app/models/comments'),
    Notification = require('app/models/notifications'),
    notifications = require('app/controllers/notifications'),
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_comments');
var error = require('debug')('error');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var taskId = yield * checkOneId(req, req.query.taskId, Task, 'id', 'taskId', 'Task');
            var task = yield * common.getTask(req, taskId);
            var productId = task.productId;
            var uoaId = task.uoaId;
            var selectFields =
                'SELECT '+
                '"Comments".*, '+
                '"Tasks"."uoaId", '+
                '"Tasks"."productId", '+
                '"SurveyQuestions"."surveyId"';

            var selectFrom =
                'FROM '+
                '"Comments" '+
                'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" '+
                'INNER JOIN "SurveyQuestions" ON "Comments"."questionId" = "SurveyQuestions"."id" '+
                //'INNER JOIN "UnitOfAnalysis" ON "Tasks"."uoaId" = "UnitOfAnalysis"."id" '+
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
                //'INNER JOIN "Products" ON "Tasks"."productId" = "Products"."id" '+
                'INNER JOIN "Surveys" ON "SurveyQuestions"."surveyId" = "Surveys"."id"';

            var selectWhere = 'WHERE 1=1 ';
            selectWhere = setWhereInt(selectWhere, req.query.questionId, 'Comments', 'questionId');
            //selectWhere = setWhereInt(selectWhere, req.query.userId, 'Comments', 'userId');
            selectWhere = setWhereInt(selectWhere, req.query.userFromId, 'Comments', 'userFromId');
            selectWhere = setWhereInt(selectWhere, req.query.taskId, 'Comments', 'taskId');
            selectWhere = setWhereInt(selectWhere, uoaId, 'Tasks', 'uoaId');
            selectWhere = setWhereInt(selectWhere, productId, 'Tasks', 'productId');
            selectWhere = setWhereInt(selectWhere, req.query.stepId, 'WorkflowSteps', 'id');
            selectWhere = setWhereInt(selectWhere, req.query.surveyId, 'Surveys', 'id');

            if(req.query.filter === 'resolve') {
                /*
                it should filter results to get actual messages without history - returning flag messages and draft resolving messages
                (isReturn && !isResolve && activated) || (isResolve && !isReturn && !activated)
                */
                selectWhere = selectWhere + ' AND (' +
                    '("Comments"."isReturn" = true AND "Comments"."isResolve" = false AND "Comments"."activated" = true) ' +
                    'OR ' +
                    '("Comments"."isReturn" = false AND "Comments"."isResolve" = true AND "Comments"."activated" = false) ' +
                    ') ';
            }

            var selectOrder = '';
            if (req.query.order) {
                var sorted = req.query.order.split(',');
                for (var i = 0; i < sorted.length; i++) {
                    var sort = sorted[i];
                    selectOrder =
                        ((selectOrder === '') ? 'ORDER BY ' : selectOrder+', ')+
                        sort.replace('-', '').trim()+
                        (sort.indexOf('-') === 0 ? ' desc' : ' asc');
                }
            }

            var selectQuery = selectFields + selectFrom + selectWhere+selectOrder;
            return yield thunkQuery(selectQuery);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var isReturn = req.body.isReturn;
            var isResolve = req.body.isResolve;
            var returnObject = yield * checkInsert(req);
            var task = yield * common.getTask(req, parseInt(req.body.taskId));
            var userTo = yield * common.getUser(req, task.userId);
            var retTask = task;
            if (returnObject) {
                retTask = yield * common.getTask(req, parseInt(returnObject.taskId));
                userTo = yield * common.getUser(req, retTask.userId);
            }
            req.body = _.extend(req.body, {userFromId: req.user.realmUserId});      // add from realmUserId instead of user id
            req.body = _.extend(req.body, {userId: userTo.id});                     // add userId from task (for backward compability)
            req.body = _.extend(req.body, {stepFromId: task.stepId});               // add stepFromId from task (for future use)
            req.body = _.extend(req.body, {stepId: task.stepId});                   // add stepId from task (don't use stepId from body - use stepId only for current task)
            if (!isReturn && !isResolve) {
                req.body = _.extend(req.body, {activated: true});                   // ordinary entries is activated
            }
            req.body = _.extend(req.body, {tags: JSON.stringify(req.body.tags)});   // stringify tags
            req.body = _.extend(req.body, {range: JSON.stringify(req.body.range)}); // stringify range

            req.body = _.pick(req.body, Comment.insertCols);                     // insert only columns that may be inserted
            var result = yield thunkQuery(Comment.insert(req.body).returning(Comment.id));

            notify(req, result[0].id, task.id, 'Comment added', 'Comments');

            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'Comments',
                entity: result[0].id,
                info: 'Add comment'
            });

            return _.first(result);

        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkUpdate(req);
            req.body = _.extend(req.body, {updated: new Date()});                   // update `updated`
            req.body = _.extend(req.body, {tags: JSON.stringify(req.body.tags)});   // stringify tags
            req.body = _.extend(req.body, {range: JSON.stringify(req.body.range)}); // stringify range
            req.body = _.pick(req.body, Comment.updateCols);                        // update only columns that may be updated
            var result = yield thunkQuery(Comment.update(req.body).where(Comment.id.equals(req.params.id)).returning(Comment.id, Comment.taskId));

            notify(req, result[0].id, result[0].taskId, 'Comment updated', 'Comments');

            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'Comments',
                entity: result[0].id,
                info: 'Update body of comment'
            });
            return result;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var entry = yield * checkCanUpdate(req, req.params.id);
            req.body.entry = entry.entry;
            notify(req, entry.id, entry.taskId, 'Comment deleted');

            yield thunkQuery(Comment.delete().where(Comment.id.equals(req.params.id)));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'Comments',
                entity: req.params.id,
                info: 'Delete comment'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    getEntryScope: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield * getAvailableUsers(req);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },
    getEntryUpdate: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield * checkCanUpdate(req, req.params.id, true);
            return (!result) ? false : true;
        }).then(function (data) {
            res.json({canUpdate: data});
        }, function (err) {
            next(err);
        });
    },
    getUsers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var taskId = yield * checkOneId(req, req.params.taskId, Task, 'id', 'taskId', 'Task');
            return yield * getUsersAndGroups(req, taskId);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }


};

function* checkInsert(req) {
    var questionId = yield * checkOneId(req, req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    var taskId = yield * checkOneId(req, req.body.taskId, Task, 'id', 'taskId', 'Task');
    //var stepId = yield * checkOneId(req, req.body.stepId, WorkflowStep, 'id', 'stepId', 'WorkflowStep');
    var entry = yield * checkString(req.body.entry, 'Entry');
    // check if return or resolve entry already exist for question
    var duplicateEntry = yield * checkDuplicateEntry(req, taskId, questionId, req.body.isReturn, req.body.isResolve);
    // get next order for entry
    var nextOrder = yield * getNextOrder(req, taskId, questionId);
    req.body = _.extend(req.body, {order: nextOrder}); // add nextOrder (if order was presented in body replace it)

    // if comment`s entry is entry with "returning" (isReturn flag is true)
    var returnObject=null;
    if (req.body.isReturn) {
        returnObject = yield * checkForReturnAndResolve(req, req.user, taskId, req.body.stepId, 'return');
        req.body = _.extend(req.body, {returnTaskId: returnObject.taskId}); // add returnTaskId
    }
    else if (req.body.isResolve) {
        returnObject = yield * checkForReturnAndResolve(req, req.user, taskId, req.body.stepId, 'resolve');
        req.body = _.omit(req.body, 'isReturn'); // remove isReturn flag from body
    }
    return returnObject;
}

function* checkUpdate(req) {
    var canUpdate = yield * checkCanUpdate(req, req.params.id);
    var entry = yield * checkString(req.body.entry, 'Entry');
}

function* checkUserId(req, user, stepId, taskId, currentStep, tag ) {
    var result;
    if (!stepId) {
        throw new HttpError(403, 'Step id (stepId) must be specified');
    }
    else if (!isInt(stepId)) {
        throw new HttpError(403, 'Step id (stepId) must be integer (' + stepId + ')');
    }
    else if (_.isString(stepId) && parseInt(stepId).toString() !== stepId) {
        throw new HttpError(403, 'Step id (stepId) must be integer (' + stepId + ')');
    }

    var thunkQuery = req.thunkQuery;
    var exist = yield thunkQuery(WorkflowStep.select().from(WorkflowStep).where(WorkflowStep.id.equals(parseInt(stepId))));
    if (!_.first(exist)) {
        throw new HttpError(403, 'Step with stepId=`'+stepId+'` does not exist');
    }
    // user Id must be in list of available users for this survey
    // 1st - get productId and uoaId for this task
    var task = yield * common.getTask(req, taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    result = yield * getUserList(req, user, taskId, productId, uoaId, currentStep, tag);
    if (!_.first(result)) {
        throw new HttpError(403, 'No available steps for this survey`s comment');
    }
    var retObject=null;

    for (var i = 0; i < result.length; i++) {
            if (result[i].stepid === parseInt(stepId)){
                retObject =
                {
                    userId: result[i].userid,
                    userName: result[i].username,
                    taskId: result[i].taskid,
                    taskName: result[i].taskname,
                    stepId: result[i].stepid,
                    stepName: result[i].stepname,
                    role: result[i].role,
                    productId: result[i].productid,
                    uoaId: result[i].uoaid,
                    commentId: null
                };
                break;
            }
    }
    if (!retObject) {
        throw new HttpError(403, 'Step with stepId=`'+stepId+'` does not available step for this survey`s comment');
    }
    // if "resolve", check that returnTaskId is exist with returnTaskId = currentTaskId, isReturn=true, isResolve=false
    if (tag === 'resolve') {
        query =
            'SELECT "Comments".id ' +
            'FROM "Comments" ' +
            pgEscape('WHERE "Comments"."returnTaskId" = %s', taskId) +
            ' AND "Comments"."isReturn" = true AND "Comments"."isResolve" = false AND "Comments"."activated" = true';
        result = yield thunkQuery(query);
        if (!_.first(result)) {
            retObject=null;
            throw new HttpError(403, 'It is not possible to post comment with "resolve" flag, because there are not found "return" task');
        }
        retObject = _.extend(retObject, {commentId: result[0].id})
    }

    return retObject;
}

function* getUserList(req, user, taskId, productId, uoaId, currentStep, tag) {

    var thunkQuery = req.thunkQuery;
    var isNotAdmin = !auth.checkAdmin(user);
    var userId = user.id;
    var blindReview = (!!currentStep.blindReview);

    if (tag !== 'resolve') {
        // available all users for this survey
        var query =
            'SELECT ' +
            '"Tasks"."userId" as userid, ' +
            '"Tasks"."id" as taskid, ' +
            '"Tasks"."title" as taskname, ' +
            '"Tasks"."stepId" as stepid, ' +
            '"WorkflowSteps"."title" as stepname, ' +
            '"WorkflowSteps"."role" as role, ' +
            'CAST( CASE WHEN ' +
            pgEscape('("WorkflowSteps"."id" <> %s AND %s) OR ', currentStep.id, blindReview) +
            pgEscape('( "Users"."isAnonymous" AND %s AND "Users"."id" <> %s) ', isNotAdmin, userId) +
            'THEN \'Anonymous\'  ELSE "Users"."firstName" END as varchar) AS "firstName", ' +
            'CAST( CASE WHEN ' +
            pgEscape('("WorkflowSteps"."id" <> %s AND %s) OR ', currentStep.id, blindReview) +
            pgEscape('( "Users"."isAnonymous" AND %s AND "Users"."id" <> %s) ', isNotAdmin, userId) +
            'THEN \'\'  ELSE "Users"."lastName" END as varchar) AS "lastName", ' +
            '"Tasks"."productId" as productid, ' +
            '"Tasks"."uoaId" as uoaid ' +
            'FROM ' +
            '"Tasks" ' +
            'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
            'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" ' +
            'WHERE ' +
            pgEscape('"Tasks"."productId" = %s AND ', productId) +
            pgEscape('"Tasks"."uoaId" = %s ', uoaId);
        if (tag === 'return') {
            query = query + pgEscape('AND "WorkflowSteps"."position" < %s', currentStep.position);
        }
        return yield thunkQuery(query);
    } else  { //if (tag === 'resolve')
        var resolve = null;
        // check existing entries with flags
        query =
            'SELECT ' +
            'sum(CASE WHEN "Comments"."isResolve" = true THEN 1 ELSE 0 END) as resolved, ' +
            'sum(CASE WHEN "Comments"."isResolve" = true THEN 0 ELSE 1 END) as nonresolved ' +
            'FROM "Comments" ' +
            pgEscape('WHERE "Comments"."returnTaskId" = %s ', taskId) +
            'AND "Comments"."isReturn" = true ' +
            'AND "Comments"."activated" = true ';
        var existFlags = yield thunkQuery(query);
        if (!_.first(existFlags)) { // flags does not exist
            // resolve list is empty
        } else {
            if (existFlags[0].nonresolved > 0) {
                // entries with not-resolved flags are exist => get resolve list
                resolve=true;
            }
        }
        if (resolve) {
            // get resolve list
            query =
                'SELECT '+
                '"Tasks"."userId" as userid, ' +
                '"Tasks"."id" as taskid, '+
                '"Tasks"."title" as taskname, '+
                '"Tasks"."stepId" as stepid, '+
                '"WorkflowSteps"."title" as stepname, '+
                '"WorkflowSteps"."role" as role, '+
                'CAST( CASE WHEN '+
                pgEscape('("WorkflowSteps"."id" <> %s AND %s) OR ', currentStep.id, blindReview)+
                pgEscape('( "Users"."isAnonymous" AND %s AND "Users"."id" <> %s) ',isNotAdmin, userId)+
                'THEN \'Anonymous\'  ELSE "Users"."firstName" END as varchar) AS "firstName", '+
                'CAST( CASE WHEN '+
                pgEscape('("WorkflowSteps"."id" <> %s AND %s) OR ', currentStep.id, blindReview)+
                pgEscape('( "Users"."isAnonymous" AND %s AND "Users"."id" <> %s) ',isNotAdmin, userId)+
                'THEN \'\'  ELSE "Users"."lastName" END as varchar) AS "lastName", '+
                '"Tasks"."productId" as productid, '+
                '"Tasks"."uoaId" as uoaid, '+
                '"Comments"."questionId" as questionid ' +
                'FROM "Comments" ' +
                'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" '+
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
                'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" '+
                pgEscape('WHERE "Comments"."returnTaskId" = %s ', taskId)+
                'AND "Comments"."isReturn" = true ' +
                'AND "Comments"."isResolve" = false ' +
                'AND "Comments"."activated" = true ' +
                'LIMIT 1';
            var result = yield thunkQuery(query);
            resolve = (_.first(result)) ? [_.last(result)] : result;
        }
        return resolve;
    }
}

function* getAvailableUsers(req) {
    var result;

    var returnList=[];
    var resolveList=[];
    var availList=[];

    var taskId = yield * checkOneId(req, req.query.taskId, Task, 'id', 'taskId', 'Task');
    var task = yield * common.getTask(req, taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;
    var currentStep = yield * getCurrentStep(req, taskId);

    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep);
    if (_.first(result)) {
        for (var i = 0; i < result.length; i++) {
            availList.push(
                {
                    userId: result[i].userid,
                    //questionId: result[i].questionid,
                    firstName: result[i].firstName,
                    lastName: result[i].lastName,
                    taskId: result[i].taskid,
                    taskName: result[i].taskname,
                    stepId: result[i].stepid,
                    stepName: result[i].stepname,
                    role: result[i].role,
                    productId: result[i].productid,
                    uoaId: result[i].uoaid
                }
            );
        }
    }
    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep, 'return');
    if (_.first(result)) {
        for (var ii = 0; ii < result.length; ii++) {
            returnList.push(
                {
                    userId: result[ii].userid,
                    //questionId: result[i].questionid,
                    firstName: result[ii].firstName,
                    lastName: result[ii].lastName,
                    taskId: result[ii].taskid,
                    taskName: result[ii].taskname,
                    stepId: result[ii].stepid,
                    stepName: result[ii].stepname,
                    role: result[ii].role,
                    productId: result[ii].productid,
                    uoaId: result[ii].uoaid
                }
            );
        }
    }
    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep, 'resolve');
    if (_.first(result)) {
        for (var j = 0; j < result.length; j++) {
            resolveList.push(
                {
                    userId: result[j].userid,
                    questionId: result[j].questionid,
                    firstName: result[j].firstName,
                    lastName: result[j].lastName,
                    taskId: result[j].taskid,
                    taskName: result[j].taskname,
                    stepId: result[j].stepid,
                    stepName: result[j].stepname,
                    role: result[j].role,
                    productId: result[j].productid,
                    uoaId: result[j].uoaid
                }
            );
        }
    }

    return {
        availList : availList,
        returnList : returnList,
        resolveList : resolveList
    };
}


function* checkNextEntry(req, id, checkOnly) {
    var result;
    var entry = yield * common.getCommentEntry(req, id);
    var task = yield * common.getTask(req, entry.taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    var query =
        'SELECT '+
        '"Comments"."questionId" '+
        'FROM "Comments" '+
        'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" '+
        'WHERE '+
            pgEscape('"Tasks"."uoaId" = %s AND ', uoaId)+
            pgEscape('"Tasks"."productId" = %s AND ', productId)+
            pgEscape('"Comments"."questionId" = %s AND ', entry.questionId)+
            pgEscape('"Comments".order > %s', entry.order);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (_.first(result)) {
        if (checkOnly) return false;
        throw new HttpError(403, 'Comment with id=`'+id+'` cannot be updated or deleted, there are have following comments');
    }
    return true;
}

function* checkCanUpdate(req, id, checkOnly) {
    /*
     Possible update ONLY self comment`s message (or admin)
     */
    var isAdmin = auth.checkAdmin(req.user);
    var entry = yield * common.getCommentEntry(req, id);
    if (!isAdmin && entry.userFromId !== req.user.id) {
        if (checkOnly) return false;
        throw new HttpError(403, 'Comment with id=`'+id+'` cannot be updated or deleted');
    }
    return entry;
}


function* getNextOrder(req, taskId, questionId) {

    // 1st - get productId and uoaId for this task
    var task = yield * common.getTask(req, taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    // then get max order for question
    var result;
    var query =
        'SELECT '+
        'max("Comments".order) as maxorder '+
        'FROM '+
        '"Comments" '+
        'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" '+
        'WHERE  '+
        pgEscape('"Tasks"."uoaId" = %s', uoaId)+
        pgEscape(' AND "Tasks"."productId" = %s', productId)+
        pgEscape(' AND "Comments"."questionId" = %s ', questionId)+
        'GROUP BY '+
        '"Comments"."questionId", '+
        '"Tasks"."uoaId", '+
        '"Tasks"."productId" ';
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first comment for question
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* checkForReturnAndResolve(req, user, taskId, stepId, tag) {
    var result;
    // get current step for survey
    var query =
        'SELECT '+
            '"Tasks"."stepId" as stepid, '+
            '"ProductUOA"."currentStepId" as currentstepid '+
        'FROM '+
            '"Tasks" '+
        'INNER JOIN "ProductUOA" ON '+
            '"ProductUOA"."productId" = "Tasks"."productId" AND '+
            '"ProductUOA"."UOAid" = "Tasks"."uoaId" '+
        'WHERE '+
            pgEscape('"Tasks"."id" = %s',  taskId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id=`'+id+'` does not exist in Tasks'); // just in case - not possible case!
    }
    if (result[0].currentstepid !== result[0].stepid) {
        throw new HttpError(403, 'It is not possible to post comment with "'+tag+'" flag, because Task stepId=`'+result[0].stepid
            +'` does not equal currentStepId=`'+result[0].currentstepid+'`');
    }

    var currentStep = yield * getCurrentStep(req, taskId);
    if (tag === 'return') {
        if (!currentStep.position || currentStep.position === 0) {
            throw new HttpError(403, 'It is not possible to post comment with "'+tag+'" flag, because there are not previous steps');
        }
    }

    return yield * checkUserId(req, user, stepId, taskId, currentStep, tag); // {returnUserId, returnTaskId, returnStepId}
}

function* getCurrentStep(req, taskId) {
    // get current step information
    query =
        'SELECT '+
        '"WorkflowSteps".* '+
        'FROM "Tasks" '+
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
        pgEscape('WHERE "Tasks"."id" = %s',  taskId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find taskId='+taskId.toString()); // just in case - I think, it is not possible case!
    }
    return result[0];
}

function* updateProductUOAStep(req, object) {
    var thunkQuery = req.thunkQuery;
    var res = yield thunkQuery(ProductUOA.update({currentStepId: object.stepId})
        .where(ProductUOA.productId.equals(object.productId)
            .and(ProductUOA.UOAid.equals(object.uoaId))
        )
            .returning(ProductUOA.currentStepId)
    );
    if (_.first(res)) {
        // notify
        var userTo = yield * common.getUser(req, task.userId);
        var note = {body: 'Task activated (flagged)'};
        note = yield * notifications.extendNote(req, note, userTo, 'Tasks', object.taskId, userTo.organizationId, object.taskId);
        note = notifications.notify(req, userTo, note, 'activateTask');

        bologger.log({
            req: req,
            action: 'update',
            object: 'productUOA',
            entity: null,
            entities: {productId: object.productId, uoaId: object.uoaId, currentStepId: object.stepId},
            quantity: 1,
            info: 'Update current step for survey'
        });
    } else {
        bologger.error({
            req: req,
            action: 'update',
            object: 'productUOA',
            entity: null,
            info: 'Update current step for survey'
        }, 'Couldn`t find survey for (productId, uoaId) = ('+object.productId.toString()+', '+object.uoaId.toString()+')');
    }
}

function* checkUpdateProductUOAStep(req, object) {
    /*
        After adding "resolve" comment - it's need to check posibility to change current step (table ProductUOA).
        If all record in table Comments for current surveys (unique Product-UoA) have isReturn==isResolve (both true - i.e. "resolve" or both false - i.e. not "returning")
        then change current step of survey to step from "return" Task.
     */
    var query =
        'SELECT "Comments"."questionId" '+
        'FROM "Comments" '+
        'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" '+
        'WHERE '+
        '"Comments"."isResolve" <> "Comments"."isReturn" AND '+
        pgEscape('"Tasks"."uoaId" = %s AND ', object.uoaId)+
        pgEscape('"Tasks"."productId" = %s', object.productId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        var res = yield thunkQuery(ProductUOA.update({currentStepId: object.stepId})
                .where(ProductUOA.productId.equals(object.productId)
                    .and(ProductUOA.UOAid.equals(object.uoaId))
            )
                .returning(ProductUOA.currentStepId)
        );
        if (_.first(res)) {

            // notify
            var userTo = yield * common.getUser(req, task.userId);
            var note = {body: 'Task activated (resolved)'};
            note = yield * notifications.extendNote(req, note, userTo, 'Tasks', object.taskId, userTo.organizationId, object.taskId);
            note = notifications.notify(req, userTo, note, 'activateTask');

            bologger.log({
                req: req,
                action: 'update',
                object: 'productUOA',
                entity: null,
                entities: {productId: object.productId, uoaId: object.uoaId, currentStepId: object.stepId},
                quantity: 1,
                info: 'Update current step for survey (when resolving)'
            });
        } else {
            bologger.error({
                req: req,
                action: 'update',
                object: 'productUOA',
                entity: null,
                info: 'Update current step for survey (when resolving)'
            }, 'Couldn`t find survey for (productId, uoaId) = ('+object.productId.toString()+', '+object.uoaId.toString()+')');
        }
    }
}

function* updateReturnTask(req, commentId) {
    var thunkQuery = req.thunkQuery;
    var res = yield thunkQuery(Comment.update({isResolve: true})
            .where(Comment.id.equals(commentId))
            .returning(Comment.id)
    );
    if (_.first(res)) {
        bologger.log({
            req: req,
            action: 'update',
            entity: commentId,
            info: 'Update task, that was returned before (resolve task)'
        });
    } else {
        bologger.error({
            req: req,
            action: 'update',
            entity: commentId,
            info: 'Update task, that was returned before (resolve task)'
        }, 'Couldn`t find comment with id = `'+commentId+'`');

    }
}

var isInt = function(val){
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function(selectQuery, val, model, key){
    if(val) {
        if ( isInt(val)) {
            selectQuery = selectQuery +pgEscape(' AND "%I"."%I" = %s', model, key, val);
        }
    }
    return selectQuery;
};

function* checkOneId(req, val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    else if (_.isString(val) && parseInt(val).toString() !== val) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    else {
        var thunkQuery = req.thunkQuery;
        var exist = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(val))));
        if (!_.first(exist)) {
            throw new HttpError(403, modelName +' with '+keyName+'=`'+val+'` does not exist');
        }
    }
    return parseInt(val);
}

function* checkString(val, keyName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    return val;
}

function* checkDuplicateEntry(req, taskId, questionId, isReturn, isResolve) {
    var thunkQuery = req.thunkQuery;
    var result;
    isReturn = (isReturn) ? true : false;
    isResolve = (isResolve) ? true : false;
    // check if comment (return or resolve) is exist for taskId, questionId
    var query =
            Comment
                .select(Comment.id)
                .from(Comment)
                .where(
                Comment.isReturn.equals(isReturn)
                    .and(Comment.activated.equals(false))
                    .and(Comment.isResolve.equals(isResolve))
                    .and(Comment.taskId.equals(taskId))
                    .and(Comment.questionId.equals(questionId))
            );
    result = yield thunkQuery(query);
    if (_.first(result)) {
        var rR = (isReturn) ?'Flag ': ((isResolve) ? 'Resolve ' : '');
        throw new HttpError(403, rR+'comment for questionId=`'+questionId+'` already exist');
    }
    return result;
}


var notify = function(req, commentId, taskId, action, essenceName){
    co(function* () {
        // notify
        var sentUsersId = [];         // array for excluding duplicate sending
        var task = yield * common.getTask(req, taskId);
        var userTo = yield * common.getUser(req, task.userId);
        var note = yield * notifications.extendNote(req, {body: req.body.entry, action: action}, userTo, essenceName, commentId, userTo.organizationId, taskId);
        note = notifications.notify(req, userTo, note, 'comment');
        sentUsersId.push(userTo.id);
        var users = yield * common.getUsersForStepByTask(req, taskId);
        for (var i in users) {
            if (sentUsersId.indexOf(users[i].userId ) === -1) {
                userTo = yield * common.getUser(req, users[i].userId);
                note = yield * notifications.extendNote(req, {body: req.body.entry, action: action}, userTo, essenceName, commentId, userTo.organizationId, taskId);
                note = notifications.notify(req, userTo, note, 'comment');
                sentUsersId.push(users[i].userId);
            }
        }
        if (req.body.tags) {
            req.body.tags = JSON.parse(req.body.tags);
            for (i in req.body.tags.users) {
                if (sentUsersId.indexOf(req.body.tags.users[i] ) === -1) {
                    userTo = yield * common.getUser(req, req.body.tags.users[i]);
                    note = yield * notifications.extendNote(req, {body: req.body.entry, action: action}, userTo, essenceName, commentId, userTo.organizationId, taskId);
                    note = notifications.notify(req, userTo, note, 'comment');
                    sentUsersId.push(req.body.tags.users[i]);
                }
            }
            for (i in req.body.tags.groups) {
                var usersFromGroup = yield * common.getUsersFromGroup(req, req.body.tags.groups[i]);
                for (var j in usersFromGroup) {
                    if (sentUsersId.indexOf(usersFromGroup[j].userId ) === -1) {
                        userTo = yield * common.getUser(req, usersFromGroup[j].userId);
                        note = yield * notifications.extendNote(req, {body: req.body.entry, action: action}, userTo, essenceName, commentId, userTo.organizationId, taskId);
                        note = notifications.notify(req, userTo, note, 'comment');
                        sentUsersId.push(usersFromGroup[j].userId);
                    }
                }
            }
        }
    }).then(function (result) {
        debug('Created notification for comment with id`'+ commentId+'`');
    }, function (err) {
        error(JSON.stringify(err));
    });
};

var getUsersAndGroups = function* (req, taskId){
    var users = [];
    var groups = [];
    var chkUsers = [];
    var chkGroups = [];
    var task = yield * common.getTask(req, taskId);
    var taskAdmin = yield * common.getUser(req, task.userId);
    users.push({
        userId: taskAdmin.id,
        firstName: taskAdmin.firstName,
        lastName: taskAdmin.lastName,
        email: taskAdmin.email
    });
    chkUsers.push(taskAdmin.id);
    var stepUsers = yield * common.getUsersForStepByTask(req, taskId);
    for (var i in stepUsers) {
        if (chkUsers.indexOf(stepUsers[i].userId ) === -1) {
            chkUsers.push(stepUsers[i].userId);
            users.push({
                userId: stepUsers[i].userId,
                firstName: stepUsers[i].firstName,
                lastName: stepUsers[i].lastName,
                email: stepUsers[i].email
            });
        }
    }
    var stepGroups = yield * common.getGroupsForStep(req, task.stepId);
    for (var i in stepGroups) {
        if (chkGroups.indexOf(stepGroups[i].groupId ) === -1) {
            chkGroups.push(stepGroups[i].groupId);
            groups.push({
                groupId : stepGroups[i].groupId,
                title: stepGroups[i].title
            });
        }
    }

    return {
        users: users,
        groups: groups,
        commentTypes: Comment.commentTypes
    };
};
