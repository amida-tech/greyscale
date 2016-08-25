var
    _ = require('underscore'),
    auth = require('app/auth'),
    config = require('config'),
    common = require('app/services/common'),
    sTask = require('app/services/tasks'),
    sTaskUserState = require('app/services/taskuserstates'),
    sComment = require('app/services/comments'),
    sSurvey = require('app/services/surveys'),
    BoLogger = require('app/bologger'),
    Organization = require('app/models/organizations'),
    bologger = new BoLogger(),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
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
    Group = require('app/models/groups'),
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

var isInt = function (val) {
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

function* checkOneId(req, val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName + ' must be specified');
    } else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    } else if (_.isString(val) && parseInt(val).toString() !== val) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    } else {
        var thunkQuery = req.thunkQuery;
        var exist = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(val))));
        if (!_.first(exist)) {
            throw new HttpError(403, modelName + ' with ' + keyName + '=`' + val + '` does not exist');
        }
    }
    return parseInt(val);
}

function* checkString(val, keyName) {
    if (!val) {
        throw new HttpError(403, keyName + ' must be specified');
    }
    return val;
}

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var taskId = yield * checkOneId(req, req.query.taskId, Task, 'id', 'taskId', 'Task');
            var oComment = new sComment(req);
            var oSurvey = new sSurvey(req);
            var maxSurveyVersion = yield oSurvey.getMaxSurveyVersion(taskId);
            var isAdmin = auth.checkAdmin(req.user);
            return oComment.getComments(taskId, req.query, req.user.id, isAdmin, maxSurveyVersion);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectAnswers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var commentId = yield * checkOneId(req, req.params.commentId, Comment, 'id', 'commentId', 'Comment');
            var selectQuery = 'SELECT "Comments".* FROM "Comments" ';

            var selectWhere = pgEscape('WHERE "Comments"."parentId" = %s ', commentId);   // select answers

            //return only activated comments and draft comments for current user
            selectWhere = selectWhere + pgEscape(' AND ("Comments"."activated" = true OR "Comments"."userFromId" = %s ) ', req.user.id);

            if (!(req.query.hidden === 'true')) {
                // show only unhidden comments
                selectWhere = selectWhere + ' AND ("Comments"."isHidden" = false) ';
            } else if(!auth.checkAdmin(req.user)) {
                // specified hidden parameters for ordinary user show only self comments (include hidden)
                selectWhere = selectWhere + pgEscape(' AND ("Comments"."isHidden" = false OR "Comments"."userFromId" = %s ) ', req.user.id);
            } // if admin - show all hidden comments

            var selectOrder = '';
            if (req.query.order) {
                var sorted = req.query.order.split(',');
                for (var i = 0; i < sorted.length; i++) {
                    var sort = sorted[i];
                    selectOrder =
                        ((selectOrder === '') ? 'ORDER BY ' : selectOrder + ', ') +
                        sort.replace('-', '').trim() +
                        (sort.indexOf('-') === 0 ? ' desc' : ' asc');
                }
            }

            selectQuery = selectQuery + selectWhere + selectOrder;
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
            var oTaskUserState = new sTaskUserState(req);
            var oComment = new sComment(req);
            var oSurvey = new sSurvey(req);
            var isReturn = req.body.isReturn;
            var isResolve = req.body.isResolve;
            yield * checkInsert(req);
            var task = yield * common.getTask(req, parseInt(req.body.taskId));
            var surveyVersion = yield oSurvey.getMaxSurveyVersion(task.id);
            req.body = _.extend(req.body, {
                surveyVersion: surveyVersion
            });
            req.body = _.extend(req.body, {
                userFromId: req.user.realmUserId
            }); // add from realmUserId instead of user id
            req.body = _.extend(req.body, {
                stepFromId: task.stepId
            }); // add stepFromId from task (for future use)
            req.body = _.extend(req.body, {
                stepId: task.stepId
            }); // add stepId from task (don't use stepId from body - use stepId only for current task)
            if (!req.query.autosave) {
                req.body = _.extend(req.body, {
                    activated: true
                }); // ordinary entries is activated
            }
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range

            if (isResolve) {
                // get userId from flagged comment
                var flaggedComment = yield * common.getEntity(req, req.body.returnTaskId, Comment, 'id');   // returnTaskId is used as reference to flag comment id
                req.body = _.extend(req.body, {
                    userId: flaggedComment.userFromId
                });
            }

            req.body = _.pick(req.body, Comment.insertCols); // insert only columns that may be inserted
            var result = yield thunkQuery(Comment.insert(req.body).returning(Comment.id));

            if (isReturn) {
                // TaskUserStates - start task for user
                yield oTaskUserState.flagged(task.id, req.user.id);
            }

            if (isResolve) {
                // update return entries - resolve their
                yield * updateReturnTask(req, req.body.returnTaskId);   // returnTaskId is used as reference to flag comment id
                yield oTaskUserState.tryUnflag(task.id, req.body.userId);
            }

            if (req.body.activated && !isResolve) {
                if (isReturn) {
                    var authorId = yield * common.getPolicyAuthorIdByTask(req, task.id);
                    oComment.notify(result[0].id, task.id, 'Flagged comment added', 'Comments', 'comment', authorId);
                } else {
                    oComment.notify(result[0].id, task.id, 'Comment added', 'Comments', 'comment');
                }
            }

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

    insertAnswer: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            yield * checkAnswerInsert(req);
            var parentComment = yield * common.getEntity(req, req.params.commentId, Comment, 'id');
            req.body = _.extend(req.body,_.pick(parentComment, Comment.answerFromParentCols)); // add key values from parent comment
            req.body = _.extend(req.body, {
                parentId: parentComment.id
            });
            req.body = _.extend(req.body, {
                userFromId: req.user.realmUserId
            }); // add from realmUserId instead of user id
            if (!req.query.autosave) { // if autosave is exist for answers
                req.body = _.extend(req.body, {
                    activated: true
                }); // answers is activated
            }
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range
            // get next order for entry
            var nextOrder = yield * getNextAnswerOrder(req, parentComment.id);
            req.body = _.extend(req.body, {
                order: nextOrder
            }); // add nextOrder (if order was presented in body replace it)

            req.body = _.pick(req.body, Comment.insertCols); // insert only columns that may be inserted
            var result = yield thunkQuery(Comment.insert(req.body).returning(Comment.id));

            if (req.body.activated) {
                oComment.notify(result[0].id, parentComment.taskId, 'Answer added', 'Comments', 'comment');
            }

            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'Comments',
                entity: result[0].id,
                info: 'Add answer to comment'
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
            var oComment = new sComment(req);
            yield * checkUpdate(req);
            req.body = _.extend(req.body, {
                updated: new Date()
            }); // update `updated`
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range
            req.body = _.pick(req.body, Comment.updateCols); // update only columns that may be updated
            var result = yield thunkQuery(Comment.update(req.body).where(Comment.id.equals(req.params.id)).returning(Comment.id, Comment.taskId, Comment.isReturn, Comment.isResolve));

            if (!result[0].isResolve) {
                if (result[0].isReturn) {
                    var authorId = yield * common.getPolicyAuthorIdByTask(req, result[0].taskId);
                    oComment.notify(result[0].id, result[0].taskId, 'Flagged comment updated', 'Comments', 'comment', authorId);
                } else {
                    oComment.notify(result[0].id, result[0].taskId, 'Comment updated', 'Comments', 'comment');
                }
            }

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
            var oComment = new sComment(req);
            var entry = yield * checkCanUpdate(req, req.params.id);
            req.body.entry = entry.entry;
            oComment.notify(entry.id, entry.taskId, 'Comment deleted', null, 'comment');

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
            res.json({
                canUpdate: data
            });
        }, function (err) {
            next(err);
        });
    },
    getUsers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oTask = new sTask(req);
            var taskId = yield * checkOneId(req, req.params.taskId, Task, 'id', 'taskId', 'Task');
            var usersAndGroups =  yield oTask.getUsersAndGroups(taskId);
            return {
                users: usersAndGroups.users,
                groups: usersAndGroups.groups,
                commentTypes: Comment.commentTypes
            };
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },
    hideUnhide: function (req, res, next) {
        // put /comments/hidden?taskId=<id>&hide=true|false&filter='all'|'flagged'|<id>
        var thunkQuery = req.thunkQuery;
        co(function* () {
            // parse query
            var hide = req.query.hide ? (req.query.hide !== 'false') : true;
            var isAdmin = auth.checkAdmin(req.user);
            var taskId = yield * checkOneId(req, req.query.taskId, Task, 'id', 'taskId', 'Task');
            var query = Comment
                .update({
                    isHidden: hide,
                    userHideId: req.user.id,
                    hiddenAt: new Date()
                })
                .where(Comment.taskId.equals(taskId))
                .and(Comment.activated.equals(true))
                .returning(Comment.id, Comment.isHidden, Comment.userHideId, Comment.hiddenAt);

            if (!isAdmin) {
                // hide/unhide only self comments
                query = query.and(Comment.userFromId.equals(req.user.id));
            }
            if (req.query.filter && req.query.filter.toUpperCase() === 'FLAGGED') {
                // hide/unhide only flagged
                query = query.and(Comment.isReturn.equals(true));
            } else if (req.query.filter && parseInt(req.query.filter) > 0) {
                // hide/unhide specified comment
                query = query.and(Comment.id.equals(parseInt(req.query.filter)));
            } // else hide/unhide all comments for specified task

            var result = yield thunkQuery(query);
            if (_.first(result)) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'Comments',
                    entities: result,
                    quantity: result.length,
                    info: 'Hide/unhide comment(s)'
                });
            }
            return result;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    }

};

function* checkInsert(req) {
    var questionId = yield * checkOneId(req, req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    var taskId = yield * checkOneId(req, req.body.taskId, Task, 'id', 'taskId', 'Task');
    if (req.body.isReturn) {
        var userId = yield * checkOneId(req, req.body.userId, User, 'id', 'userId', 'User');
    }
    var entry = yield * checkString(req.body.entry, 'Entry');
    // get next order for entry
    var nextOrder = yield * getNextOrder(req, taskId, questionId);
    req.body = _.extend(req.body, {
        order: nextOrder
    }); // add nextOrder (if order was presented in body replace it)

    // if comment`s entry is entry with "returning" (isReturn flag is true)
    var returnObject = null;
    if (req.body.isReturn) {
        req.body = _.extend(req.body, {
            returnTaskId: taskId
        }); // add returnTaskId
    } else if (req.body.isResolve) {
        req.body = _.omit(req.body, 'isReturn'); // remove isReturn flag from body
    }
}

function* checkAnswerInsert(req) {
    var commentId = yield * checkOneId(req, req.params.commentId, Comment, 'id', 'commentId', 'Comment');
    if (!req.body.isAgree ) { // disagree
        yield * checkString(req.body.entry, 'Entry');
    }

}

function* checkUpdate(req) {
    var canUpdate = yield * checkCanUpdate(req, req.params.id);
    var entry = yield * checkString(req.body.entry, 'Entry');
}

function* checkUserId(req, user, stepId, taskId, currentStep, tag) {
    var result;
    if (!stepId) {
        throw new HttpError(403, 'Step id (stepId) must be specified');
    } else if (!isInt(stepId)) {
        throw new HttpError(403, 'Step id (stepId) must be integer (' + stepId + ')');
    } else if (_.isString(stepId) && parseInt(stepId).toString() !== stepId) {
        throw new HttpError(403, 'Step id (stepId) must be integer (' + stepId + ')');
    }

    var thunkQuery = req.thunkQuery;
    var exist = yield thunkQuery(WorkflowStep.select().from(WorkflowStep).where(WorkflowStep.id.equals(parseInt(stepId))));
    if (!_.first(exist)) {
        throw new HttpError(403, 'Step with stepId=`' + stepId + '` does not exist');
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
    var retObject = null;

    for (var i = 0; i < result.length; i++) {
        if (result[i].stepid === parseInt(stepId)) {
            retObject = {
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
        throw new HttpError(403, 'Step with stepId=`' + stepId + '` does not available step for this survey`s comment');
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
            retObject = null;
            throw new HttpError(403, 'It is not possible to post comment with "resolve" flag, because there are not found "return" task');
        }
        retObject = _.extend(retObject, {
            commentId: result[0].id
        });
    }

    return retObject;
}

function* getUserList(req, user, taskId, productId, uoaId, currentStep, tag) {

    var thunkQuery = req.thunkQuery;
    var isNotAdmin = !auth.checkAdmin(user);
    var userId = user.id;
    var blindReview = (!!currentStep.blindReview);
    var query;

    if (tag !== 'resolve') {
        // available all users for this survey
        query =
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
    } else { //if (tag === 'resolve')
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
                resolve = true;
            }
        }
        if (resolve) {
            // get resolve list
            query =
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
                '"Tasks"."uoaId" as uoaid, ' +
                '"Comments"."questionId" as questionid ' +
                'FROM "Comments" ' +
                'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" ' +
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
                'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" ' +
                pgEscape('WHERE "Comments"."returnTaskId" = %s ', taskId) +
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

    var returnList = [];
    var resolveList = [];
    var availList = [];

    var taskId = yield * checkOneId(req, req.query.taskId, Task, 'id', 'taskId', 'Task');
    var task = yield * common.getTask(req, taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;
    var currentStep = yield * getCurrentStep(req, taskId);

    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep);
    if (_.first(result)) {
        for (var i = 0; i < result.length; i++) {
            availList.push({
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
            });
        }
    }
    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep, 'return');
    if (_.first(result)) {
        for (var ii = 0; ii < result.length; ii++) {
            returnList.push({
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
            });
        }
    }
    result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep, 'resolve');
    if (_.first(result)) {
        for (var j = 0; j < result.length; j++) {
            resolveList.push({
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
            });
        }
    }

    return {
        availList: availList,
        returnList: returnList,
        resolveList: resolveList
    };
}

function* checkNextEntry(req, id, checkOnly) {
    var result;
    var entry = yield * common.getCommentEntry(req, id);
    var task = yield * common.getTask(req, entry.taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    var query =
        'SELECT ' +
        '"Comments"."questionId" ' +
        'FROM "Comments" ' +
        'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" ' +
        'WHERE ' +
        pgEscape('"Tasks"."uoaId" = %s AND ', uoaId) +
        pgEscape('"Tasks"."productId" = %s AND ', productId) +
        pgEscape('"Comments"."questionId" = %s AND ', entry.questionId) +
        pgEscape('"Comments".order > %s', entry.order);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (_.first(result)) {
        if (checkOnly) {
            return false;
        }
        throw new HttpError(403, 'Comment with id=`' + id + '` cannot be updated or deleted, there are have following comments');
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
        if (checkOnly) {
            return false;
        }
        throw new HttpError(403, 'Comment with id=`' + id + '` cannot be updated or deleted');
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
        'SELECT ' +
        'max("Comments".order) as maxorder ' +
        'FROM ' +
        '"Comments" ' +
        'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" ' +
        'WHERE  ' +
        pgEscape('"Tasks"."uoaId" = %s', uoaId) +
        pgEscape(' AND "Tasks"."productId" = %s', productId) +
        pgEscape(' AND "Comments"."questionId" = %s ', questionId) +
        'GROUP BY ' +
        '"Comments"."questionId", ' +
        '"Tasks"."uoaId", ' +
        '"Tasks"."productId" ';
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first comment for question
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* getNextAnswerOrder(req, commentId) {

    // then get max order for answers
    var result;
    var query =
        'SELECT ' +
        'max("Comments".order) as maxorder ' +
        'FROM ' +
        '"Comments" ' +
        'WHERE  ' +
        pgEscape('"Comments"."parentId" = %s', commentId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first answer for comment
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* getCurrentStep(req, taskId) {
    // get current step information
    query =
        'SELECT ' +
        '"WorkflowSteps".* ' +
        'FROM "Tasks" ' +
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
        pgEscape('WHERE "Tasks"."id" = %s', taskId);
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find taskId=' + taskId.toString()); // just in case - I think, it is not possible case!
    }
    return result[0];
}

function* checkDuplicateAnswer(req, taskId, commentId, userId) {
    var thunkQuery = req.thunkQuery;
    var result;
    var query =
        Comment
        .select(Comment.id)
        .from(Comment)
        .where(
            Comment.parentId.equals(commentId)
            .and(Comment.taskId.equals(taskId))
            .and(Comment.userFromId.equals(userId))
        );
    result = yield thunkQuery(query);
    if (_.first(result)) {
        throw new HttpError(403, 'User already agreed/disagreed with this comment');
    }
    return result;
}

function* updateReturnTask(req, commentId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Comment.update({
            isResolve: true
        })
            .where(
            Comment.id.equals(commentId)
        )
            .returning(Comment.id)
    );
    if (_.first(result)) {
        bologger.log({
            req: req,
            action: 'update',
            object: 'Comments',
            entities: commentId,
            info: 'Resolve flag'
        });
    }
}
