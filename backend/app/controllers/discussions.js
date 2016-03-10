var
    _ = require('underscore'),
    auth = require('app/auth'),
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
    Discussion = require('app/models/discussions'),
    Notification = require('app/models/notifications'),
    notifications = require('app/controllers/notifications'),
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var isInt = function(val){
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function(selectQuery, val, model, key){
    if(val) {
        if ( isInt(val)) {
            selectQuery = selectQuery +' AND "'+model+'"."'+key+'" = '+val;
        }
    }
    return selectQuery;
};

function* checkOneId(val, model, key, keyName, modelName) {
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

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            var selectFields =
                'SELECT '+
                '"Discussions".*, '+
                '"Tasks"."uoaId", '+
                '"Tasks"."stepId", '+
                '"Tasks"."productId", '+
                '"SurveyQuestions"."surveyId"';

            var selectFrom =
                'FROM '+
                '"Discussions" '+
                'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" '+
                'INNER JOIN "SurveyQuestions" ON "Discussions"."questionId" = "SurveyQuestions"."id" '+
                'INNER JOIN "UnitOfAnalysis" ON "Tasks"."uoaId" = "UnitOfAnalysis"."id" '+
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
                'INNER JOIN "Products" ON "Tasks"."productId" = "Products"."id" '+
                'INNER JOIN "Surveys" ON "SurveyQuestions"."surveyId" = "Surveys"."id"';

            var selectWhere = 'WHERE 1=1 ';
            selectWhere = setWhereInt(selectWhere, req.query.questionId, 'Discussions', 'questionId');
            selectWhere = setWhereInt(selectWhere, req.query.userId, 'Discussions', 'userId');
            selectWhere = setWhereInt(selectWhere, req.query.userFromId, 'Discussions', 'userFromId');
            selectWhere = setWhereInt(selectWhere, req.query.taskId, 'Discussions', 'taskId');
            selectWhere = setWhereInt(selectWhere, req.query.uoaId, 'UnitOfAnalysis', 'id');
            selectWhere = setWhereInt(selectWhere, req.query.productId, 'Products', 'id');
            selectWhere = setWhereInt(selectWhere, req.query.stepId, 'WorkflowSteps', 'id');
            selectWhere = setWhereInt(selectWhere, req.query.surveyId, 'Surveys', 'id');

            var selectQuery = selectFields + selectFrom + selectWhere;
            return yield thunkQuery(selectQuery, _.pick(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            var isReturn = req.body.isReturn;
            var isResolve = req.body.isResolve;
            var returnObject = yield * checkInsert(req);
            req.body = _.extend(req.body, {userFromId: req.user.id}); // add from user id
            req.body = _.pick(req.body, Discussion.insertCols); // insert only columns that may be inserted
            var result = yield thunkQuery(Discussion.insert(req.body).returning(Discussion.id));
            var entry=_.first(result);
            var newStep;
            if (isReturn) {
                newStep = yield * updateProductUOAStep(returnObject);
            }
            if (isResolve) {
                var returnTask = yield * updateReturnTask(returnObject.discussionId);
                newStep = yield * checkUpdateProductUOAStep(returnObject);
            }
            var essenceId = yield * getEssenceId('Discussions');
            var userFrom = yield * getUser(req.user.id);
            var userTo = yield * getUser(req.body.userId);
            // static blindRewiev
            var taskId = yield * checkOneId(req.body.taskId, Task, 'id', 'taskId', 'Task'); // ToDo: exclude unwanted query
            var step4userTo = yield * getUserToStep(taskId, userTo.id);
            var userFromName = userFrom.firstName + ' ' + userFrom.lastName;
            var from = {firstName: userFrom.firstName, lastName: userFrom.lastName};
            if (step4userTo.blindReview) {
                userFromName = step4userTo.role + ' (' + step4userTo.title + ')';
                from = {firstName: step4userTo.role, lastName: '(' + step4userTo.title + ')'};
            } else if (userFrom.isAnonymous) {
                userFromName = 'Anonymous -' + step4userTo.role + ' (' + step4userTo.title + ')';
                from = {firstName: 'Anonymous -' + step4userTo.role, lastName: '(' + step4userTo.title + ')'};
            }
            //
            var note = yield * notifications.createNotification(
                {
                    userFrom: req.user.id,
                    userFromName: userFromName,
                    userTo: req.body.userId,
                    body: req.body.entry,
                    essenceId: essenceId,
                    entityId: entry.id,
                    discussionEntry:  req.body,
                    action: 'add',
                    notifyLevel: 2,
                    from: from,
                    to: {firstName : userTo.firstName, lastName: userTo.lastName},
                    subject: 'Indaba. New message in discussion'
                },
                {
                    notificationName: 'entry',
                    notificationPath: './views/notifications/',
                    emailName: 'discussion',
                    emailPath: './views/emails/'
                } // ToDo: change templates to EJS engine
            );
            return entry;
        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkUpdate(req);
            req.body = _.extend(req.body, {updated: new Date()}); // update `updated`
            req.body = _.pick(req.body, Discussion.updateCols); // update only columns that may be updated
            var result = yield thunkQuery(Discussion.update(req.body).where(Discussion.id.equals(req.params.id)));
            var entry = yield * getDiscussionEntry(req.params.id);
            var essenceId = yield * getEssenceId('Discussions');
            var userFrom = yield * getUser(req.user.id);
            var userTo = yield * getUser(entry.userId);
            // static blindRewiev
            var step4userTo = yield * getUserToStep(entry.taskId, userTo.id);
            var userFromName = userFrom.firstName + ' ' + userFrom.lastName;
            var from = {firstName: userFrom.firstName, lastName: userFrom.lastName};
            if (step4userTo.blindReview) {
                userFromName = step4userTo.role + ' (' + step4userTo.title + ')';
                from = {firstName: step4userTo.role, lastName: '(' + step4userTo.title + ')'};
            } else if (userFrom.isAnonymous) {
                userFromName = 'Anonymous -' + step4userTo.role + ' (' + step4userTo.title + ')';
                from = {firstName: 'Anonymous -' + step4userTo.role, lastName: '(' + step4userTo.title + ')'};
            }
            //
            var note = yield * notifications.createNotification(
                {
                    userFrom: req.user.id,
                    userFromName: userFromName,
                    userTo: entry.userId,
                    body: entry.entry,
                    essenceId: essenceId,
                    entityId: entry.id,
                    discussionEntry:  entry,
                    action: 'update',
                    notifyLevel: 2,
                    from: from,
                    to: {firstName : userTo.firstName, lastName: userTo.lastName},
                    subject: 'Indaba. Update message in discussion'
                },
                {
                    notificationName: 'entry',
                    notificationPath: './views/notifications/',
                    emailName: 'discussion',
                    emailPath: './views/emails/'
                } // ToDo: change templates to EJS engine
            );
            return result;

        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Discussion.delete().where(Discussion.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    getEntryScope: function (req, res, next) {
        co(function* () {
            return yield * getAvailableUsers(req);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },
    getEntryUpdate: function (req, res, next) {
        co(function* () {
            /*
             Possible update ONLY discussion`s message (entry) if discussion`s entry does not have next message for current Question
             */
            // check next entry
            return yield * checkNextEntry(req.params.id, true);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },
    getUsers: function (req, res, next) {
        co(function* () {
            var userList=[];

            var taskId = yield * checkOneId(req.params.taskId, Task, 'id', 'taskId', 'Task');
            var ids = yield * getProductAndUoaIds(taskId);
            var productId = ids.productId;
            var uoaId = ids.uoaId;
            var currentStep = yield * getCurrentStep(taskId);

            var result = yield * getUserList(req.user, taskId, productId, uoaId, currentStep);
            if (_.first(result)) {
                for (var i = 0; i < result.length; i++) {
                    userList.push(
                        {
                            userId: result[i].userid,
                            firstName: result[i].firstName,
                            lastName: result[i].lastName,
                            stepId: result[i].stepid,
                            stepName: result[i].stepname,
                            role: result[i].role
                        }
                    );
                }
            }
            return userList;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }


};

function* checkInsert(req) {
    var questionId = yield * checkOneId(req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    var taskId = yield * checkOneId(req.body.taskId, Task, 'id', 'taskId', 'Task');
    var userId = yield * checkOneId(req.body.userId, User, 'id', 'userId', 'User');
    var entry = yield * checkString(req.body.entry, 'Entry');
    // get next order for entry
    var nextOrder = yield * getNextOrder(taskId, questionId);
    req.body = _.extend(req.body, {order: nextOrder}); // add nextOrder (if order was presented in body replace it)

    // if discussion`s entry is entry with "returning" (isReturn flag is true)
    var returnObject=null;
    if (req.body.isReturn) {
        returnObject = yield * checkForReturnAndResolve(req.user, taskId, req.body.userId, 'return');
        req.body = _.extend(req.body, {returnTaskId: returnObject.taskId}); // add returnTaskId
    }
    else if (req.body.isResolve) {
        returnObject = yield * checkForReturnAndResolve(req.user, taskId, req.body.userId, 'resolve');
        req.body = _.omit(req.body, 'isReturn', 'isResolve'); // remove isReturn flag from body
    }
    return returnObject;
}

function* checkUpdate(req) {
    /*
     Possible update ONLY discussion`s message (entry) if discussion`s entry does not have next message for current Question
     */
    // check next entry
    var nextEntry = yield * checkNextEntry(req.params.id);
    var entry = yield * checkString(req.body.entry, 'Entry');
}

function* checkUserId(user, userId, taskId, currentStep, tag ) {
    var result;
    if (!userId) {
        throw new HttpError(403, 'User id (userId) must be specified');
    }
    else if (!isInt(userId)) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    }
    else if (_.isString(userId) && parseInt(userId).toString() !== userId) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    }

    var exist = yield thunkQuery(User.select().from(User).where(User.id.equals(parseInt(userId))));
    if (!_.first(exist)) {
        throw new HttpError(403, 'User with userId=`'+userId+'` does not exist');
    }
    // user Id must be in list of available users for this survey
    // 1st - get productId and uoaId for this task
    var ids = yield * getProductAndUoaIds(taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;

    result = yield * getUserList(user, taskId, productId, uoaId, currentStep, tag);
    if (!_.first(result)) {
        throw new HttpError(403, 'No available users for this survey'); // just in case - I think, it is not possible case!
    }
    var retObject=null;

    for (var i = 0; i < result.length; i++) {
            if (result[i].id === parseInt(userId)){
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
                    discussionId: null
                };
                break;
            }
    }
    if (!retObject) {
        throw new HttpError(403, 'User with userId=`'+userId+'` does not available user for this survey');
    }
    // if "resolve", check that returnTaskId is exist with returnTaskId = currentTaskId, isReturn=true, isResolve=false
    if (tag === 'resolve') {
        query =
            'SELECT "Discussions".id ' +
            'FROM "Discussions" ' +
            'WHERE "Discussions"."returnTaskId" = ' + taskId.toString() +
            ' AND "Discussions"."isReturn" = true AND "Discussions"."isResolve" = false';
        result = yield thunkQuery(query);
        if (!_.first(result)) {
            retObject=null;
            throw new HttpError(403, 'It is not possible to post entry with "resolve" flag, because there are not found "return" task');
        }
        retObject = _.extend(retObject, {discussionId: result[0].id})
    }

    return retObject;
}

function* getUserList(user, taskId, productId, uoaId, currentStep, tag) {
    var isNotAdmin = !auth.checkAdmin(user);
    var userId = user.id;
    // available all users for this survey
    var query =
        'SELECT ' +
            '"Tasks"."userId" as userid, ' +
            '"Tasks"."id" as taskid, '+
            '"Tasks"."title" as taskname, '+
            '"Tasks"."stepId" as stepid, '+
            '"WorkflowSteps"."title" as stepname, '+
            '"WorkflowSteps"."role" as role, '+
            'CAST( CASE WHEN '+
                '("WorkflowSteps"."id" <> '+currentStep.id.toString()+ ' AND '+currentStep.blindReview+') OR '+
                '( "Users"."isAnonymous" AND '+isNotAdmin.toString()+' AND "Users"."id" <> '+parseInt(userId).toString()+') '+
                'THEN \'Anonymous\'  ELSE "Users"."firstName" END as varchar) AS "firstName", '+
            'CAST( CASE WHEN '+
                '("WorkflowSteps"."id" <> '+currentStep.id.toString()+ ' AND '+currentStep.blindReview+') OR '+
                '( "Users"."isAnonymous" AND '+isNotAdmin.toString()+' AND "Users"."id" <> '+parseInt(userId).toString()+') '+
                'THEN \'\'  ELSE "Users"."lastName" END as varchar) AS "lastName", '+
            '"Tasks"."productId" as productid, '+
            '"Tasks"."uoaId" as uoaid '+
        'FROM ' +
            '"Tasks" '+
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
        'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" '+
        'WHERE ' +
            '"Tasks"."productId" = ' + productId + ' AND ' +
            '"Tasks"."uoaId" = ' + uoaId +' ';
    if (tag === 'return'){
        query = query + 'AND "WorkflowSteps"."position" < '+currentStep.position.toString();
    } else if (tag == 'resolve') {
        query =
            'SELECT '+
                '"Tasks"."userId" as userid, ' +
                '"Tasks"."id" as taskid, '+
                '"Tasks"."title" as taskname, '+
                '"Tasks"."stepId" as stepid, '+
                '"WorkflowSteps"."title" as stepname, '+
                '"WorkflowSteps"."role" as role, '+
                'CAST( CASE WHEN '+
                    '("WorkflowSteps"."id" <> '+currentStep.id.toString()+ ' AND '+currentStep.blindReview+') OR '+
                    '( "Users"."isAnonymous" AND '+isNotAdmin.toString()+' AND "Users"."id" <> '+parseInt(userId).toString()+') '+
                    'THEN \'Anonymous\'  ELSE "Users"."firstName" END as varchar) AS "firstName", '+
                'CAST( CASE WHEN '+
                    '("WorkflowSteps"."id" <> '+currentStep.id.toString()+ ' AND '+currentStep.blindReview+') OR '+
                    '( "Users"."isAnonymous" AND '+isNotAdmin.toString()+' AND "Users"."id" <> '+parseInt(userId).toString()+') '+
                    'THEN \'\'  ELSE "Users"."lastName" END as varchar) AS "lastName", '+
            '"Tasks"."productId" as productid, '+
            '"Tasks"."uoaId" as uoaid '+
            'FROM "Discussions" ' +
            'INNER JOIN "Tasks" ON "Discussions"."returnTaskId" = "Tasks"."id" '+
            'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
            'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" '+
            'WHERE "Discussions"."returnTaskId" = ' + taskId.toString() + ' '+
                'AND "Discussions"."isReturn" = true AND "Discussions"."isResolve" = false';
    }
    return yield thunkQuery(query);
}

function* getAvailableUsers(req) {
    var result;

    var returnList=[];
    var resolveList=[];
    var availList=[];

    var taskId = yield * checkOneId(req.query.taskId, Task, 'id', 'taskId', 'Task');
    var ids = yield * getProductAndUoaIds(taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;
    var currentStep = yield * getCurrentStep(taskId);

    result = yield * getUserList(req.user, taskId, productId, uoaId, currentStep);
    if (_.first(result)) {
        for (var i = 0; i < result.length; i++) {
            availList.push(
                {
                    userId: result[i].userid,
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
    result = yield * getUserList(req.user, taskId, productId, uoaId, currentStep, 'return');
    if (_.first(result)) {
        for (var ii = 0; ii < result.length; ii++) {
            returnList.push(
                {
                    userId: result[ii].userid,
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
    result = yield * getUserList(req.user, taskId, productId, uoaId, currentStep, 'resolve');
    if (_.first(result)) {
        for (var j = 0; j < result.length; j++) {
            resolveList.push(
                {
                    userId: result[j].userid,
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


function* checkNextEntry(id, checkOnly) {
    var result;
    var entry = yield * getDiscussionEntry(id);
    var ids = yield * getProductAndUoaIds(entry.taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;

    var query =
        'SELECT '+
        '"Discussions"."questionId" '+
        'FROM "Discussions" '+
        'INNER JOIN "public"."Tasks" ON "public"."Discussions"."taskId" = "public"."Tasks"."id" '+
        'WHERE '+
            '"Tasks"."uoaId" = '+ids.uoaId.toString()+' AND '+
            '"Tasks"."productId" = '+ids.productId.toString()+' AND '+
            '"Discussions".order > '+entry.order.toString();
    result = yield thunkQuery(query);
    if (_.first(result)) {
        if (checkOnly) return false;
        throw new HttpError(403, 'Entry with id=`'+id+'` cannot be updated, there are have following entries');
    }
    return true;
}

function* getNextOrder(taskId, questionId) {

    // 1st - get productId and uoaId for this task
    var ids = yield * getProductAndUoaIds(taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;

    // then get max order for question
    var result;
    var query =
        'SELECT '+
        'max("Discussions".order) as maxorder '+
        'FROM '+
        '"Discussions" '+
        'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" '+
        'WHERE  '+
        '"Tasks"."uoaId" = '+uoaId.toString()+
        ' AND "Tasks"."productId" = '+productId.toString()+
        ' AND "Discussions"."questionId" = '+questionId.toString()+' '+
        'GROUP BY '+
        '"Discussions"."questionId", '+
        '"Tasks"."uoaId", '+
        '"Tasks"."productId" ';
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first entry for question
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* getProductAndUoaIds(taskId) {
    var query =
        'SELECT '+
        '"Tasks"."uoaId", '+
        '"Tasks"."productId" '+
        'FROM '+
        '"Tasks" '+
        'WHERE '+
        '"Tasks"."id" = '+taskId;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with taskId=`'+taskId+'` does not exist'); // just in case - not possible case!
    }
    return {productId:result[0].productId, uoaId:result[0].uoaId};
}

function* checkForReturnAndResolve(user, taskId, userId, tag) {
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
            '"Tasks"."id" = '+taskId;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id=`'+id+'` does not exist in Tasks'); // just in case - not possible case!
    }
    if (result[0].currentstepid !== result[0].stepid) {
        throw new HttpError(403, 'It is not possible to post entry with "'+tag+'" flag, because Task stepId=`'+result[0].stepid
            +'` does not equal currentStepId=`'+result[0].currentstepid+'`');
    }

    var currentStep = yield * getCurrentStep(taskId);
    if (!currentStep.position || currentStep.position === 0) {
        throw new HttpError(403, 'It is not possible to post entry with "'+tag+'" flag, because there are not previous steps');
    }

    return yield * checkUserId(user, userId, taskId, tag, currentStep); // {returnUserId, returnTaskId, returnStepId}
}

function* getCurrentStep(taskId) {
    // get current step information
    query =
        'SELECT '+
        '"WorkflowSteps".* '+
        'FROM "Tasks" '+
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
        'WHERE "Tasks"."id" = '+taskId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find taskId='+taskId.toString()); // just in case - I think, it is not possible case!
    }
    return result[0];
}

function* updateProductUOAStep(object) {
    var updateProductUOAQuery =
        'UPDATE "ProductUOA" '+
        'SET "currentStepId" = ' +object.stepId.toString()+ ' '+
        'WHERE "productId"= '+object.productId.toString()+
        ' AND "UOAid" = '+object.uoaId.toString();
    return yield thunkQuery(updateProductUOAQuery);
}

function* checkUpdateProductUOAStep(object) {
    /*
        After adding "resolve" entry - it's need to check posibility to change current step (table ProductUOA).
        If all record in table Discussions for current surveys (unique Product-UoA) have isReturn==isResolve (both true - i.e. "resolve" or both false - i.e. not "returning")
        then change current step of survey to step from "return" Task.
     */
    var query =
        'SELECT "Discussions"."questionId" '+
        'FROM "Discussions" '+
        'INNER JOIN "public"."Tasks" ON "public"."Discussions"."taskId" = "public"."Tasks"."id" '+
        'WHERE '+
        '"Discussions"."isResolve" <> "Discussions"."isReturn" AND '+
        '"Tasks"."uoaId" = '+object.uoaId.toString()+' AND '+
        '"Tasks"."productId" = '+object.productId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        var updateProductUOAQuery =
            'UPDATE "ProductUOA" '+
            'SET "currentStepId" = ' +object.stepId.toString()+ ' '+
            'WHERE "productId"= '+object.productId.toString()+
            ' AND "UOAid" = '+object.uoaId.toString();
        return yield thunkQuery(updateProductUOAQuery);
    }
}

function* updateReturnTask(discussionId) {
    var updateReturnTaskQuery =
        'UPDATE "Discussions" '+
        'SET "isResolve" = true, "updated" = now() '+
        'WHERE "id"= '+discussionId.toString();
    return yield thunkQuery(updateReturnTaskQuery);
}

function* getEssenceId(essenceName) {
    query =
        'SELECT '+
        '"Essences"."id" '+
        'FROM "Essences" '+
        'WHERE "Essences"."name" = \''+essenceName+'\'';
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Essence `'+essenceName+'"');
    }
    return result[0].id;
}

function* getUser(userId) {
    query =
        'SELECT "Users".* '+
        'FROM "Users" '+
        'WHERE "Users"."id" = ' + parseInt(userId).toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find User with id `'+parseInt(userId).toString()+'`');
    }
    return result[0];
}

function* getDiscussionEntry(id) {
    var result;
    var query =
        'SELECT "Discussions".* '+
        'FROM "Discussions" '+
        'WHERE "Discussions"."id" = '+id;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Entry with id=`'+id+'` does not exist in discussions'); // just in case - not possible case!
    }
    return result[0];
}

function* getUserToStep(taskId, userId) {
    // get step information for userId
    query =
        'SELECT '+
        '"WorkflowSteps".* '+
        'FROM "Tasks" '+
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
        'WHERE '+
        '"Tasks"."id" = '+taskId.toString() + ' AND '+
        '"Tasks"."userId" = '+userId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find step for (taskId, userId)=('+taskId.toString()+', '+userId.toString()+')'); // just in case - I think, it is not possible case!
    }
    return result[0];
}
