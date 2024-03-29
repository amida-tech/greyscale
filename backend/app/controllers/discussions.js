'use strict';

var
    _ = require('underscore'),
    auth = require('../auth'),
    config = require('../../config'),
    common = require('../services/common'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Product = require('../models/products'),
    ProductUOA = require('../models/product_uoa'),
    WorkflowStep = require('../models/workflow_steps'),
    Task = require('../models/tasks'),
    Discussion = require('../models/discussions'),
    notifications = require('../controllers/notifications'),
    co = require('co'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_discussions');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var isInt = function (val) {
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function (selectQuery, val, model, key) {
    if (val) {
        if (isInt(val)) {
            selectQuery = selectQuery + pgEscape(' AND "%I"."%I" = %s', model, key, val);
        }
    }
    return selectQuery;
};

var notify = function (req, note0, entryId, taskId, essenceName, templateName) {
    co(function* () {
        var userTo, note;
        // notify
        userTo = yield * common.getUser(req, req.body.userId);
        note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);

        // get the notification email to send out
        notifications.notify(req, userTo, note, templateName);

    }).then(function (result) {
        debug('Created notifications `' + note0.action + '`');
    }, function (err) {
        error(JSON.stringify(err));
    });
};

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var task = yield * common.getTask(req, req.query.taskId);
            var uoaId = task.uoaId;
            var selectFields =
                'SELECT ' +
                '"Discussions".*, ' +
                '"Tasks"."uoaId"';

            var selectFrom =
                'FROM ' +
                '"Discussions" ' +
                'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id"';

            var selectWhere = 'WHERE "Tasks".id = ' + task.id + ' ';
            selectWhere = setWhereInt(selectWhere, uoaId, 'Tasks', 'uoaId');

            if (req.query.filter === 'resolve') {
                /*
                 it should filter results to get actual messages without history - returning flag messages and draft resolving messages
                 (isReturn && !isResolve && activated) || (isResolve && !isReturn && !activated)
                 */
                selectWhere = selectWhere + ' AND (' +
                    '("Discussions"."isReturn" = true AND "Discussions"."isResolve" = false AND "Discussions"."activated" = true) ' +
                    'OR ' +
                    '("Discussions"."isReturn" = false AND "Discussions"."isResolve" = true AND "Discussions"."activated" = false) ' +
                    ') ';
            }

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

            var selectQuery = selectFields + selectFrom + selectWhere + selectOrder;
            var discussionData = _.map(_.groupBy(yield thunkQuery(selectQuery), 'questionId'), function(discussion, questionId) {
                return { questionId, discussion }
            });

            if (req.user.roleID !== 2 && !task.userIds.includes(req.user.realmUserId)) {
                var filteredData = _.filter(discussionData, (flag) =>
                    _.some(flag.discussion, (discuss) => (discuss.userId === req.user.realmUserId ||
                        discuss.userFromId === req.user.realmUserId)));
                return filteredData;
            }
            return discussionData;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    getByTaskID: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var taskId = req.params.id;
            var discussions = yield thunkQuery(
                '( ' +
                'SELECT ' +
                '"Discussions".* ' +
                'FROM "Discussions" ' +
                'WHERE "Discussions"."taskId" = ' + taskId +
                'ORDER BY "Discussions"."order", "Discussions"."created" ' +
                ') '
            );
            if (!_.first(discussions)) {
                throw new HttpError(403, 'Not found');
            }

            var questionsAndDiscussionsList = [];
            var questionsAndDiscussionsDict = {};

            for (var i = 0; i < discussions.length; i++) {
                if (!(discussions[i].questionId in questionsAndDiscussionsDict)) {
                    questionsAndDiscussionsDict[discussions[i].questionId] = [discussions[i]];
                } else {
                    questionsAndDiscussionsDict[discussions[i].questionId].push(discussions[i]);
                }
            }

            for (var questionId in questionsAndDiscussionsDict) {
                if (questionsAndDiscussionsDict.hasOwnProperty(questionId)) {
                    questionsAndDiscussionsList.push({
                        questionId,
                        'comments': questionsAndDiscussionsDict[questionId]
                    });
                }
            }

            return questionsAndDiscussionsList;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var task = yield * common.getTask(req, parseInt(req.body.taskId));
            req.body = _.extend(req.body, {
                userFromId: req.user.realmUserId
            }); // add from realmUserId instead of user id
            req.body = _.extend(req.body, {
                stepFromId: task.stepId
            }); // add stepFromId from task (for future use)
            if (!req.body.isResolve) {
                req.body = _.extend(req.body, {
                    activated: true
                }); // ordinary entries is activated
            } else {
                yield thunkQuery(
                    Discussion.update({ isResolve: true })
                    .where(Discussion.taskId.equals(req.body.taskId))
                    .and(Discussion.questionId.equals(req.body.questionId))
                    .and(Discussion.stepId.equals(req.body.stepId))
                );
            }
            req.body = _.pick(req.body, Discussion.insertCols); // insert only columns that may be inserted
            var result = yield thunkQuery(Discussion.insert(req.body).returning(Discussion.id));

            yield * notifyHelper(req, _.first(result).id);

            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'discussions',
                entity: result[0].id,
                info: 'Add discussion`s entry'
            });

            yield bumpProjectLastUpdatedForTask(req, parseInt(req.body.taskId));

            return result;

        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkUpdate(req);
            req.body = _.extend(req.body, {
                updated: new Date()
            }); // update `updated`
            req.body = _.pick(req.body, Discussion.updateCols); // update only columns that may be updated

            var result = yield thunkQuery(Discussion.update(req.body).where(Discussion.id.equals(req.params.id)).returning(Discussion.id));

            // prepare for notify
            yield * notifyHelper(req, _.first(result).id);

            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'discussions',
                entity: result.id,
                info: 'Update body of discussion`s entry'
            });
            return result;
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            // check next entry
            var nextEntry = yield * checkNextEntry(req, req.params.id);
            return yield thunkQuery(Discussion.delete().where(Discussion.id.equals(req.params.id)));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'discussions',
                entity: req.params.id,
                info: 'Delete discussion`s entry'
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
            /*
             Possible update ONLY discussion`s message (entry) if discussion`s entry does not have next message for current Question
             */
            // check next entry
            return yield * checkNextEntry(req, req.params.id, true);
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
            var userList = [];

            var taskId = yield * checkOneId(req, req.params.taskId, Task, 'id', 'taskId', 'Task');
            var task = yield * common.getTask(req, taskId);
            var productId = task.productId;
            var uoaId = task.uoaId;
            var currentStep = yield * getCurrentStep(req, taskId);

            var result = yield * getUserList(req, req.user, taskId, productId, uoaId, currentStep);
            if (_.first(result)) {
                for (var i = 0; i < result.length; i++) {
                    userList.push({
                        userId: result[i].userid,
                        userIds: result[i].userids,
                        groupIds: result[i].groupids,
                        firstName: result[i].firstName,
                        lastName: result[i].lastName,
                        stepId: result[i].stepid,
                        stepName: result[i].stepname,
                        role: result[i].role
                    });
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
    //var questionId = yield * checkOneId(req, req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    // TODO: Perry, you may consider adding a check to Survey Services for an Questions ID here.
    var task = _.first(yield * checkOneId(req, req.body.taskId, Task, 'id', 'taskId', 'Task'));
    var step = _.first(yield * checkOneId(req, req.body.stepId, WorkflowStep, 'id', 'stepId', 'WorkflowStep'));
    var entry = yield * checkString(req.body.entry, 'Entry');
    if (req.body.isReturn || req.body.isResolve) { // check if return or resolve entry already exist for question
        var duplicateEntry = yield * checkDuplicateEntry(req, task.id, req.body.questionId, req.body.isReturn, req.body.isResolve);
    }
    // get next order for entry
    var nextOrder = yield * getNextOrder(req, task, req.body.questionId);
    req.body = _.extend(req.body, {
        order: nextOrder
    }); // add nextOrder (if order was presented in body replace it)
    // if discussion`s entry is entry with "returning" (isReturn flag is true)
    var returnObject = null;
    if (req.body.isReturn) {
        returnObject = yield * checkForReturnAndResolve(req, req.user, task.id, step.id, 'return');
        req.body = _.extend(req.body, {
            returnTaskId: returnObject.taskId
        }); // add returnTaskId
    } else if (req.body.isResolve) {
        returnObject = yield * checkForReturnAndResolve(req, req.user, task.id, step.id, 'resolve');
        req.body = _.omit(req.body, 'isReturn'); // remove isReturn flag from body
    }
    return returnObject;
}

function* checkUpdate(req) {
    /*
     Possible update ONLY discussion`s message (entry) if discussion`s entry does not have next message for current Question
     */
    // check next entry
    var nextEntry = yield * checkNextEntry(req, req.params.id);
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
        throw new HttpError(403, 'No available steps for this survey`s discussion entry');
    }
    var retObject = null;

    for (var i = 0; i < result.length; i++) {
        if (result[i].stepid === parseInt(stepId)) {
            retObject = {
                userId: result[i].userid,
                userIds: result[i].userids,
                groupIds: result[i].groupids,
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
        throw new HttpError(403, 'Step with stepId=`' + stepId + '` does not available step for this survey`s discussion entry');
    }
    // if "resolve", check that returnTaskId is exist with returnTaskId = currentTaskId, isReturn=true, isResolve=false
    if (tag === 'resolve') {
        query =
            'SELECT "Discussions".id ' +
            'FROM "Discussions" ' +
            pgEscape('WHERE "Discussions"."returnTaskId" = %s', taskId) +
            ' AND "Discussions"."isReturn" = true AND "Discussions"."isResolve" = false AND "Discussions"."activated" = true';
        result = yield thunkQuery(query);
        if (!_.first(result)) {
            retObject = null;
            throw new HttpError(403, 'It is not possible to post entry with "resolve" flag, because there are not found "return" task');
        }
        retObject = _.extend(retObject, {
            discussionId: result[0].id
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
            '"Tasks"."userIds" as userids, ' +
            '"Tasks"."groupIds" as groupids, ' +
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
            'INNER JOIN "Users" ON "Tasks"."userIds"[1] = "Users"."id" ' +
            'WHERE ' +
            pgEscape('"Tasks"."productId" = %s AND ', productId) +
            pgEscape('"Tasks"."uoaId" = %s ', uoaId);
        if (tag === 'return') {
            query = query + pgEscape('AND "WorkflowSteps"."position" < %s ', currentStep.position);
        }
        query = query + 'ORDER BY "WorkflowSteps"."id"';
        return yield thunkQuery(query);
    } else { //if (tag === 'resolve')
        var resolve = null;
        // check existing entries with flags
        query =
            'SELECT ' +
            'sum(CASE WHEN "Discussions"."isResolve" = true THEN 1 ELSE 0 END) as resolved, ' +
            'sum(CASE WHEN "Discussions"."isResolve" = true THEN 0 ELSE 1 END) as nonresolved ' +
            'FROM "Discussions" ' +
            pgEscape('WHERE "Discussions"."returnTaskId" = %s ', taskId) +
            'AND "Discussions"."isReturn" = true ' +
            'AND "Discussions"."activated" = true ';
        var existFlags = yield thunkQuery(query);
        if (!_.first(existFlags)) { // flags does not exist
            // resolve list is empty
        } else {
            if (existFlags[0].nonresolved > 0) {
                // entries with not-resolved flags are exist => get resolve list
                resolve = true;
                /*
                            } else if (existFlags[0].resolved > 0) {
                                // entries with resolved flags are exist => check resolve-entries
                                query =
                                    'SELECT ' +
                                    'sum(CASE WHEN "Discussions"."activated" = true THEN 0 ELSE 1 END) as nonactivated ' +
                                    'FROM "Discussions" ' +
                                    pgEscape('WHERE "Discussions"."taskId" = %s ', taskId) +
                                    'AND "Discussions"."isReturn" = false ' +
                                    'AND "Discussions"."isResolve" = true ';
                                var existResolves = yield thunkQuery(query);
                                if (!_.first(existResolves)) { // resolves does not exist -> not possible!?
                                    // resolve list is empty
                                } else {
                                    if (existResolves[0].nonactivated > 0) {
                                        // non activated resolve entries are exist => get resolve list
                                        resolve=true;
                                    } else {
                                        // resolve list is empty
                                    }
                                }
                */
            }
        }
        if (resolve) {
            // get resolve list
            query =
                'SELECT ' +
                '"Tasks"."userIds" as userids, ' +
                '"Tasks"."groupIds" as groupids, ' +
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
                '"Discussions"."questionId" as questionid ' +
                'FROM "Discussions" ' +
                'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" ' +
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
                'INNER JOIN "Users" ON "Tasks"."userIds"[1] = "Users"."id" ' +
                pgEscape('WHERE "Discussions"."returnTaskId" = %s ', taskId) +
                'AND "Discussions"."isReturn" = true ' +
                'AND "Discussions"."isResolve" = false ' +
                'AND "Discussions"."activated" = true ' +
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
                userIds: result[i].userids,
                groupIds: result[i].groupids,
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
                userIds: result[ii].userids,
                groupIds: result[ii].groupids,
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
                userIds: result[j].userids,
                groupIds: result[j].groupids,
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
    //var result;
    var entry = yield * common.getDiscussionEntry(req, id);
    return !entry.activated;
    if (entry.activated && !checkOnly) {
        throw new HttpError(403, 'Entry with id=`' + id + '` cannot be updated or deleted');
    }
    /*
    var task = yield * common.getTask(req, entry.taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    var query =
        'SELECT ' +
        '"Discussions"."questionId" ' +
        'FROM "Discussions" ' +
        'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" ' +
        'WHERE ' +
        pgEscape('"Tasks"."uoaId" = %s AND ', uoaId) +
        pgEscape('"Tasks"."productId" = %s AND ', productId) +
        pgEscape('"Discussions"."questionId" = %s AND ', entry.questionId) +
        pgEscape('"Discussions".order > %s', entry.order);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (_.first(result)) {
        if (checkOnly) {
            return false;
        }
        throw new HttpError(403, 'Entry with id=`' + id + '` cannot be updated.');
    }
    return true;
    */
}

function* getNextOrder(req, task, questionId) {

    // 1st - get productId and uoaId for this task
    // var task = yield * common.getTask(req, taskId);
    var productId = task.productId;
    var uoaId = task.uoaId;

    // then get max order for question
    var result;
    var query =
        'SELECT ' +
        'max("Discussions".order) as maxorder ' +
        'FROM ' +
        '"Discussions" ' +
        'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" ' +
        'WHERE  ' +
        pgEscape('"Tasks"."uoaId" = %s', uoaId) +
        pgEscape(' AND "Tasks"."productId" = %s', productId) +
        pgEscape(' AND "Discussions"."questionId" = %s ', questionId) +
        'GROUP BY ' +
        '"Discussions"."questionId", ' +
        '"Tasks"."uoaId", ' +
        '"Tasks"."productId" ';
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first entry for question
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* checkForReturnAndResolve(req, user, taskId, stepId, tag) {
    var result;
    // get current step for survey
    var query =
        'SELECT ' +
        '"Tasks"."stepId" as stepid, ' +
        '"ProductUOA"."currentStepId" as currentstepid ' +
        'FROM ' +
        '"Tasks" ' +
        'INNER JOIN "ProductUOA" ON ' +
        '"ProductUOA"."productId" = "Tasks"."productId" AND ' +
        '"ProductUOA"."UOAid" = "Tasks"."uoaId" ' +
        'WHERE ' +
        pgEscape('"Tasks"."id" = %s', taskId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id=`' + taskId + '` does not exist in Tasks'); // just in case - not possible case!
    }
    if (result[0].currentstepid !== result[0].stepid) {
        throw new HttpError(403, 'It is not possible to post entry with "' + tag + '" flag, because Task stepId=`' + result[0].stepid +
            '` does not equal currentStepId=`' + result[0].currentstepid + '`');
    }

    var currentStep = yield * getCurrentStep(req, taskId);
    if (tag === 'return') {
        if (!currentStep.position || currentStep.position === 0) {
            throw new HttpError(403, 'It is not possible to post entry with "' + tag + '" flag, because there are not previous steps');
        }
    }

    return yield * checkUserId(req, user, stepId, taskId, currentStep, tag); // {returnUserId, returnTaskId, returnStepId}
}

function* getCurrentStep(req, taskId) {
    // get current step information
    var result;
    query =
        'SELECT ' +
        '"WorkflowSteps".* ' +
        'FROM "Tasks" ' +
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
        pgEscape('WHERE "Tasks"."id" = %s', taskId);
    var thunkQuery = req.thunkQuery;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find taskId=' + taskId.toString()); // just in case - I think, it is not possible case!
    }
    return result[0];
}

function* updateReturnTask(req, discussionId) {
    var thunkQuery = req.thunkQuery;
    var res = yield thunkQuery(Discussion.update({
        isResolve: true
    })
        .where(Discussion.id.equals(discussionId))
        .returning(Discussion.id)
    );
    if (_.first(res)) {
        bologger.log({
            req: req,
            action: 'update',
            entity: discussionId,
            info: 'Update task, that was returned before (resolve task)'
        });
    } else {
        bologger.error({
            req: req,
            action: 'update',
            entity: discussionId,
            info: 'Update task, that was returned before (resolve task)'
        }, 'Couldn`t find discussion`s entry with id = `' + discussionId + '`');

    }
}

function* getUserToStep(req, productId, uoaId, userId) {
    // get step information for userId
    query =
        'SELECT ' +
        '"WorkflowSteps".*, ' +
        '"Tasks"."id" as taskid ' +
        'FROM "Tasks" ' +
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
        'WHERE ' +
        pgEscape('"Tasks"."productId" = %s AND ', productId) +
        pgEscape('"Tasks"."uoaId" = %s AND ', uoaId) +
        pgEscape('"Tasks"."userIds"[1] = %s', userId);
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find step for (productId, uoaId, userId)=(' + productId.toString() + ', ' + uoaId.toString() + ', ' + userId.toString() + ')');
    }
    return result[0];
}

function* checkOneId(req, val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName + ' must be specified');
    } else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    } else if (_.isString(val) && parseInt(val).toString() !== val) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    var thunkQuery = req.thunkQuery;
    var exist = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(val))));
    if (!_.first(exist)) {
        throw new HttpError(403, modelName + ' with ' + keyName + '=`' + val + '` does not exist');
    }
    return exist;
}

function* checkString(val, keyName) {
    if (!val) {
        throw new HttpError(403, keyName + ' must be specified');
    }
    return val;
}

function* checkDuplicateEntry(req, taskId, questionId, isReturn, isResolve) {
    var thunkQuery = req.thunkQuery;
    var result;
    isReturn = (isReturn) ? true : false;
    isResolve = (isResolve) ? true : false;
    // check if entry (return or resolve) is exist for taskId, questionId
    var query =
        Discussion
        .select(Discussion.id)
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(isReturn)
            .and(Discussion.activated.equals(false))
            .and(Discussion.isResolve.equals(isResolve))
            .and(Discussion.taskId.equals(taskId))
            .and(Discussion.questionId.equals(questionId))
        );
    result = yield thunkQuery(query);
    if (_.first(result)) {
        var rR = (isReturn) ? 'Flag ' : ((isResolve) ? 'Resolve ' : '');
        throw new HttpError(403, rR + 'entry for questionId=`' + questionId + '` already exist');
    }
    return result;
}

function* returnTaskIdIfReturnFlagsExists(req, taskId) {
    /*
     Check (return) flag(s) exists and return returnTaskId
     */
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion
        .select(Discussion.returnTaskId)
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(true)
            .and(Discussion.activated.equals(false))
            .and(Discussion.taskId.equals(taskId))
        )
    );
    return (_.first(result)) ? result[0].returnTaskId : null;
}

function* notifyHelper(req, discussionId) {

    var discussion = yield * common.getDiscussionEntry(req, discussionId);

    if (!discussion.isReturn && !discussion.isResolve) {
        var userFrom = yield * common.getUser(req, req.user.id),
            stepTo = yield * common.getEntity(req, discussion.stepId, WorkflowStep, 'id');

        var userFromName = userFrom.firstName + ' ' + userFrom.lastName;

        var from = {
            firstName: userFrom.firstName,
            lastName: userFrom.lastName
        };

        if (stepTo.blindReview) {
            userFromName = stepTo.role + ' (' + stepTo.title + ')';
            from = {
                firstName: stepTo.role,
                lastName: '(' + stepTo.title + ')'
            };
        } else if (userFrom.isAnonymous) {
            userFromName = 'Anonymous -' + stepTo.role + ' (' + stepTo.title + ')';
            from = {
                firstName: 'Anonymous -' + stepTo.role,
                lastName: '(' + stepTo.title + ')'
            };
        }
        notify(req, {
            body: req.body.entry,
            action: 'Comment updated',
            userFromName: userFromName,
            from: from
        }, discussion.id, discussion.taskId, 'Discussions', 'discussion');
    }
}

function * bumpProjectLastUpdatedForTask(req, taskId) {
    const taskResult = yield req.thunkQuery(
        Task
        .select(Product.projectId)
        .from(
            Task.leftJoin(Product)
            .on(Task.productId.equals(Product.id)))
        .where(Task.id.equals(taskId))
    );
    if (taskResult.length === 1) {
        yield common.bumpProjectLastUpdated(req, taskResult[0].projectId);
    }
}
