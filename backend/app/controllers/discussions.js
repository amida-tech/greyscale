var
    _ = require('underscore'),
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
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var isInt = function (val) {
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function (selectQuery, val, model, key) {
    if (val) {
        if (isInt(val)) {
            selectQuery = selectQuery + ' AND "' + model + '"."' + key + '" = ' + val;
        }
    }
    return selectQuery;
};

function* checkOneId(val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName + ' must be specified');
    } else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    } else if (_.isString(val) && parseInt(val).toString() !== val) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    } else {
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
        co(function* () {
            var selectFields =
                'SELECT ' +
                '"Discussions".*, ' +
                '"Tasks"."uoaId", ' +
                '"Tasks"."stepId", ' +
                '"Tasks"."productId", ' +
                '"SurveyQuestions"."surveyId"';
            /*
                            '"Tasks".title as "taskName" '+
                            '"UnitOfAnalysis"."name" as "uoaName", '+
                            '"WorkflowSteps".title as "stepName",  '+
                            '"Products".title as "productName", '+
                            '"Surveys".title as "surveyName" '+
             */
            var selectUserField =
                '(SELECT  ' +
                'CAST( ' +
                'CASE  ' +
                'WHEN "isAnonymous" or "WorkflowSteps"."blindReview" ' +
                'THEN \'Anonymous\'  ' +
                'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") ' +
                'END as varchar ' +
                ') ' +
                'FROM "Users" ' +
                'WHERE "Users"."id" =  "Discussions"."userId" ' +
                ') AS "userName"';
            var selectUserFromField =
                '(SELECT  ' +
                'CAST( ' +
                'CASE  ' +
                'WHEN "isAnonymous" or "WorkflowSteps"."blindReview" ' +
                'THEN \'Anonymous\'  ' +
                'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") ' +
                'END as varchar ' +
                ') ' +
                'FROM "Users" ' +
                'WHERE "Users"."id" =  "Discussions"."userFromId" ' +
                ') AS "userFromName"';
            selectFields = selectFields + ', ' + selectUserField + ', ' + selectUserFromField;

            var selectFrom =
                'FROM ' +
                '"Discussions" ' +
                'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" ' +
                'INNER JOIN "SurveyQuestions" ON "Discussions"."questionId" = "SurveyQuestions"."id" ' +
                'INNER JOIN "UnitOfAnalysis" ON "Tasks"."uoaId" = "UnitOfAnalysis"."id" ' +
                'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
                'INNER JOIN "Products" ON "Tasks"."productId" = "Products"."id" ' +
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
            req.body = _.extend(req.body, {
                userFromId: req.user.id
            }); // add from user id
            var entryId = yield thunkQuery(Discussion.insert(req.body).returning(Discussion.id));
            var newStep;
            if (isReturn) {
                newStep = yield * updateProductUOAStep(returnObject);
            }
            if (isResolve) {
                var returnTask = yield * updateReturnTask(returnObject.discussionId);
                newStep = yield * checkUpdateProductUOAStep(returnObject);
            }
            return entryId;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkUpdate(req);
            req.body = _.pick(req.body, 'entry'); // update only entry (NOT else)
            req.body = _.extend(req.body, {
                updated: new Date()
            }); // update `updated`
            return yield thunkQuery(Discussion.update(req.body).where(Discussion.id.equals(req.params.id)));
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
            var userList = [];

            var taskId = yield * checkOneId(req.params.taskId, Task, 'id', 'taskId', 'Task');
            var ids = yield * getProductAndUoaIds(taskId);
            var productId = ids.productId;
            var uoaId = ids.uoaId;

            var result = yield * getUserList(taskId, productId, uoaId);
            if (_.first(result)) {
                for (var i = 0; i < result.length; i++) {
                    userList.push({
                        userId: result[i].userid,
                        firstName: result[i].firstName,
                        lastName: result[i].lastName,
                        stepName: result[i].stepname
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
    var questionId = yield * checkOneId(req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    var taskId = yield * checkOneId(req.body.taskId, Task, 'id', 'taskId', 'Task');
    var entry = yield * checkString(req.body.entry, 'Entry');
    // get next order for entry
    var nextOrder = yield * getNextOrder(taskId, questionId);
    req.body = _.extend(req.body, {
        order: nextOrder
    }); // add nextOrder (if order was presented in body replace it)

    // if discussion`s entry is entry with "returning" (isReturn flag is true)
    var returnObject = null;
    if (req.body.isReturn) {
        returnObject = yield * checkForReturnAndResolve(taskId, req.body.userId, 'return');
        req.body = _.extend(req.body, {
            returnTaskId: returnObject.taskId
        }); // add returnTaskId
    } else if (req.body.isResolve) {
        returnObject = yield * checkForReturnAndResolve(taskId, req.body.userId, 'resolve');
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

function* checkUserId(userId, taskId, tag, currentStepPosition) {
    var result;
    if (!userId) {
        throw new HttpError(403, 'User id (userId) must be specified');
    } else if (!isInt(userId)) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    } else if (_.isString(userId) && parseInt(userId).toString() !== userId) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    }

    var exist = yield thunkQuery(User.select().from(User).where(User.id.equals(parseInt(userId))));
    if (!_.first(exist)) {
        throw new HttpError(403, 'User with userId=`' + userId + '` does not exist');
    }
    // user Id must be in list of available users for this survey
    // 1st - get productId and uoaId for this task
    var ids = yield * getProductAndUoaIds(taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;

    result = yield * getUserList(taskId, productId, uoaId, tag, currentStepPosition);
    if (!_.first(result)) {
        throw new HttpError(403, 'No available users for this survey'); // just in case - I think, it is not possible case!
    }
    var retObject = null;

    for (var i = 0; i < result.length; i++) {
        if (result[i].id === parseInt(userId)) {
            retObject = {
                userId: result[i].userid,
                userName: result[i].username,
                taskId: result[i].taskid,
                taskName: result[i].taskname,
                stepId: result[i].stepid,
                stepName: result[i].stepname,
                productId: result[i].productid,
                uoaId: result[i].uoaid,
                discussionId: null
            };
            break;
        }
    }
    if (!retObject) {
        throw new HttpError(403, 'User with userId=`' + userId + '` does not available user for this survey');
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
            retObject = null;
            throw new HttpError(403, 'It is not possible to post entry with "resolve" flag, because there are not found "return" task');
        }
        retObject = _.extend(retObject, {
            discussionId: result[0].id
        })
    }

    return retObject;
}

function* getUserList(taskId, productId, uoaId, tag, currentStepPosition) {
    // available all users for this survey
    var query =
        'SELECT ' +
        '"Tasks"."userId" as userid, ' +
        '"Tasks"."id" as taskid, ' +
        '"Tasks"."title" as taskname, ' +
        '"Tasks"."stepId" as stepid, ' +
        '"WorkflowSteps"."title" as stepname, ' +
        'CAST( ' +
        'CASE  ' +
        'WHEN "Users"."isAnonymous" or "WorkflowSteps"."blindReview" ' +
        'THEN \'Anonymous\'  ' +
        'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") ' +
        'END as varchar ' +
        ') AS "username", ' +
        'CAST( ' +
        'CASE  ' +
        'WHEN "Users"."isAnonymous" or "WorkflowSteps"."blindReview" ' +
        'THEN \'Anonymous\'  ' +
        'ELSE "Users"."firstName" ' +
        'END as varchar ' +
        ') AS "firstName", ' +
        'CAST( ' +
        'CASE  ' +
        'WHEN "Users"."isAnonymous" or "WorkflowSteps"."blindReview" ' +
        'THEN \'Anonymous\'  ' +
        'ELSE "Users"."lastName" ' +
        'END as varchar ' +
        ') AS "lastName", ' +
        '"Tasks"."productId" as productid, ' +
        '"Tasks"."uoaId" as uoaid ' +
        'FROM ' +
        '"Tasks" ' +
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
        'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" ' +
        'WHERE ' +
        '"Tasks"."productId" = ' + productId + ' AND ' +
        '"Tasks"."uoaId" = ' + uoaId + ' ';
    if (tag === 'return') {
        query = query + 'AND "WorkflowSteps"."position" < ' + currentStepPosition.toString();
    } else if (tag == 'resolve') {
        query =
            'SELECT ' +
            '"Tasks"."userId" as userid, ' +
            '"Tasks"."id" as taskid, ' +
            '"Tasks"."title" as taskname, ' +
            '"Tasks"."stepId" as stepid, ' +
            '"WorkflowSteps"."title" as stepname, ' +
            'CAST( ' +
            'CASE  ' +
            'WHEN "Users"."isAnonymous" or "WorkflowSteps"."blindReview" ' +
            'THEN \'Anonymous\'  ' +
            'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") ' +
            'END as varchar ' +
            ') AS "username", ' +
            '"Tasks"."productId" as productid, ' +
            '"Tasks"."uoaId" as uoaid ' +
            'FROM "Discussions" ' +
            'INNER JOIN "Tasks" ON "Discussions"."returnTaskId" = "Tasks"."id" ' +
            'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
            'INNER JOIN "Users" ON "Tasks"."userId" = "Users"."id" ' +
            'WHERE "Discussions"."returnTaskId" = ' + taskId.toString() + ' ' +
            'AND "Discussions"."isReturn" = true AND "Discussions"."isResolve" = false';
    }
    return yield thunkQuery(query);
}

function* getAvailableUsers(req) {
    var result;

    var returnList = [];
    var resolveList = [];
    var availList = [];

    var taskId = yield * checkOneId(req.query.taskId, Task, 'id', 'taskId', 'Task');
    var ids = yield * getProductAndUoaIds(taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;
    var currentStepPosition = yield * getCurrentStepPosition(taskId);

    result = yield * getUserList(taskId, productId, uoaId);
    if (_.first(result)) {
        for (var i = 0; i < result.length; i++) {
            availList.push({
                userId: result[i].userid,
                userName: result[i].username,
                taskId: result[i].taskid,
                taskName: result[i].taskname,
                stepId: result[i].stepid,
                stepName: result[i].stepname,
                productId: result[i].productid,
                uoaId: result[i].uoaid
            });
        }
    }
    result = yield * getUserList(taskId, productId, uoaId, 'return', currentStepPosition);
    if (_.first(result)) {
        for (var ii = 0; ii < result.length; ii++) {
            returnList.push({
                userId: result[ii].userid,
                userName: result[ii].username,
                taskId: result[ii].taskid,
                taskName: result[ii].taskname,
                stepId: result[ii].stepid,
                stepName: result[ii].stepname,
                productId: result[ii].productid,
                uoaId: result[ii].uoaid
            });
        }
    }
    result = yield * getUserList(taskId, productId, uoaId, 'resolve', currentStepPosition);
    if (_.first(result)) {
        for (var j = 0; j < result.length; j++) {
            resolveList.push({
                userId: result[j].userid,
                userName: result[j].username,
                taskId: result[j].taskid,
                taskName: result[j].taskname,
                stepId: result[j].stepid,
                stepName: result[j].stepname,
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

function* getTask(id) {
    var result;
    var query =
        'SELECT ' +
        '"Discussions"."taskId", ' +
        '"Discussions"."order" ' +
        'FROM ' +
        '"Discussions" ' +
        'WHERE ' +
        '"Discussions"."id" = ' + id;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Entry with id=`' + id + '` does not exist in discussions'); // just in case - not possible case!
    }
    return result[0];
}

function* checkNextEntry(id, checkOnly) {
    var result;
    var task = yield * getTask(id);
    var ids = yield * getProductAndUoaIds(task.taskId);
    var productId = ids.productId;
    var uoaId = ids.uoaId;

    var query =
        'SELECT ' +
        '"Discussions"."questionId" ' +
        'FROM "Discussions" ' +
        'INNER JOIN "public"."Tasks" ON "public"."Discussions"."taskId" = "public"."Tasks"."id" ' +
        'WHERE ' +
        '"Tasks"."uoaId" = ' + ids.uoaId.toString() + ' AND ' +
        '"Tasks"."productId" = ' + ids.productId.toString() + ' AND ' +
        '"Discussions".order > ' + task.order.toString();
    result = yield thunkQuery(query);
    if (_.first(result)) {
        if (checkOnly) return false;
        throw new HttpError(403, 'Entry with id=`' + id + '` cannot be updated, there are have following entries');
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
        'SELECT ' +
        'max("Discussions".order) as maxorder ' +
        'FROM ' +
        '"Discussions" ' +
        'INNER JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" ' +
        'WHERE  ' +
        '"Tasks"."uoaId" = ' + uoaId.toString() +
        ' AND "Tasks"."productId" = ' + productId.toString() +
        ' AND "Discussions"."questionId" = ' + questionId.toString() + ' ' +
        'GROUP BY ' +
        '"Discussions"."questionId", ' +
        '"Tasks"."uoaId", ' +
        '"Tasks"."productId" ';
    result = yield thunkQuery(query);
    // get next order
    // if not found records, nextOrder must be 1  - the first entry for question
    return (!_.first(result)) ? 1 : result[0].maxorder + 1;
}

function* getProductAndUoaIds(taskId) {
    var query =
        'SELECT ' +
        '"Tasks"."uoaId", ' +
        '"Tasks"."productId" ' +
        'FROM ' +
        '"Tasks" ' +
        'WHERE ' +
        '"Tasks"."id" = ' + taskId;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with taskId=`' + taskId + '` does not exist'); // just in case - not possible case!
    }
    return {
        productId: result[0].productId,
        uoaId: result[0].uoaId
    };
}

function* checkForReturnAndResolve(taskId, userId, tag) {
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
        '"Tasks"."id" = ' + taskId;
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id=`' + id + '` does not exist in Tasks'); // just in case - not possible case!
    }
    if (result[0].currentstepid !== result[0].stepid) {
        throw new HttpError(403, 'It is not possible to post entry with "' + tag + '" flag, because Task stepId=`' + result[0].stepid + '` does not equal currentStepId=`' + result[0].currentstepid + '`');
    }

    var currentStepPosition = yield * getCurrentStepPosition(taskId);
    if (currentStepPosition === 0) {
        throw new HttpError(403, 'It is not possible to post entry with "' + tag + '" flag, because there are not previous steps');
    }

    return yield * checkUserId(userId, taskId, tag, currentStepPosition); // {returnUserId, returnTaskId, returnStepId}
}

function* getCurrentStepPosition(taskId) {
    // get current step position
    query =
        'SELECT ' +
        '"WorkflowSteps"."position" as position ' +
        'FROM "Tasks" ' +
        'INNER JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" ' +
        'WHERE "Tasks"."id" = ' + taskId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find taskId=' + taskId.toString()); // just in case - I think, it is not possible case!
    }
    return (isInt(result[0].position)) ? result[0].position : 0;
}

function* updateProductUOAStep(object) {
    var updateProductUOAQuery =
        'UPDATE "ProductUOA" ' +
        'SET "currentStepId" = ' + object.stepId.toString() + ' ' +
        'WHERE "productId"= ' + object.productId.toString() +
        ' AND "UOAid" = ' + object.uoaId.toString();
    return yield thunkQuery(updateProductUOAQuery);
}

function* checkUpdateProductUOAStep(object) {
    /*
        After adding "resolve" entry - it's need to check posibility to change current step (table ProductUOA).
        If all record in table Discussions for current surveys (unique Product-UoA) have isReturn==isResolve (both true - i.e. "resolve" or both false - i.e. not "returning")
        then change current step of survey to step from "return" Task.
     */
    var query =
        'SELECT "Discussions"."questionId" ' +
        'FROM "Discussions" ' +
        'INNER JOIN "public"."Tasks" ON "public"."Discussions"."taskId" = "public"."Tasks"."id" ' +
        'WHERE ' +
        '"Discussions"."isResolve" <> "Discussions"."isReturn" AND ' +
        '"Tasks"."uoaId" = ' + object.uoaId.toString() + ' AND ' +
        '"Tasks"."productId" = ' + object.productId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        var updateProductUOAQuery =
            'UPDATE "ProductUOA" ' +
            'SET "currentStepId" = ' + object.stepId.toString() + ' ' +
            'WHERE "productId"= ' + object.productId.toString() +
            ' AND "UOAid" = ' + object.uoaId.toString();
        return yield thunkQuery(updateProductUOAQuery);
    }
}

function* updateReturnTask(discussionId) {
    var updateReturnTaskQuery =
        'UPDATE "Discussions" ' +
        'SET "isResolve" = true, "updated" = now() ' +
        'WHERE "id"= ' + discussionId.toString();
    return yield thunkQuery(updateReturnTaskQuery);
}
