var
    _ = require('underscore'),
    Product = require('app/models/products'),
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

var isInt = function(val){
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function(selectQuery, val, model, key){
    if(val) {
        if ( isInt(val)) {
            //selectQuery = selectQuery.whereClause ? selectQuery.andWhere(model[key].equals(parseInt(val))) : selectQuery.where(model[key].equals(parseInt(val)));
            selectQuery = selectQuery.where(model[key].equals(parseInt(val)));
        }
    }
    return selectQuery;
};

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            var selectQuery = Discussion
                .select(
                    Discussion.star(),
                    Task.title.as('taskName'),
                    Task.uoaId,
                    Task.stepId,
                    Task.productId,
                    SurveyQuestion.surveyId,
                    User.email.as('userName'),
                    UOA.name.as('uoaName'),
                    WorkflowStep.title.as('stepName'),
                    Product.title.as('productName'),
                    Survey.title.as('surveyName')
                )
                    .from(
                    Discussion
                        .leftJoin(Task)
                        .on(Discussion.taskId.equals(Task.id))
                        .leftJoin(SurveyQuestion)
                        .on(Discussion.questionId.equals(SurveyQuestion.id))
                        .leftJoin(User)
                        .on(Discussion.userId.equals(User.id))
                        .leftJoin(UOA)
                        .on(Task.uoaId.equals(UOA.id))
                        .leftJoin(Product)
                        .on(Task.productId.equals(Product.id))
                        .leftJoin(WorkflowStep)
                        .on(Task.stepId.equals(WorkflowStep.id))
                        .leftJoin(Survey)
                        .on(SurveyQuestion.surveyId.equals(Survey.id))
                );
            selectQuery = setWhereInt(selectQuery, req.query.questionId, Discussion, 'questionId');
            selectQuery = setWhereInt(selectQuery, req.query.userId, User, 'id');
            selectQuery = setWhereInt(selectQuery, req.query.taskId, Discussion, 'taskId');
            selectQuery = setWhereInt(selectQuery, req.query.uoaId, UOA, 'id');
            selectQuery = setWhereInt(selectQuery, req.query.productId, Product, 'id');
            selectQuery = setWhereInt(selectQuery, req.query.stepId, WorkflowStep, 'id');
            selectQuery = setWhereInt(selectQuery, req.query.surveyId, Survey, 'id');

            return yield thunkQuery(selectQuery, _.pick(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkInsert(req);
            return yield thunkQuery(Discussion.insert(req.body).returning(Discussion.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkUpdate(req);
            req.body = _.pick(req.body, 'userId', 'entry', 'flag'); // update only userId, entry, flag (NOT taskId and questionId)
            req.body = _.extend(req.body, {updated: new Date()}); // update `updated`
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
    }

};

function* checkOneId(val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    else if (parseInt(val).toString() !== val) {
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

function* checkUserId(userId, taskId) {
    var result;
    if (!userId) {
        throw new HttpError(403, 'User id (userId) must be specified');
    }
    else if (!isInt(userId)) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    }
    else if (parseInt(userId).toString() !== userId) {
        throw new HttpError(403, 'User id (userId) must be integer (' + userId + ')');
    }
    else {
        var exist = yield thunkQuery(User.select().from(User).where(User.id.equals(parseInt(userId))));
        if (!_.first(exist)) {
            throw new HttpError(403, 'User with userId=`'+userId+'` does not exist');
        }
        // user Id must be in list of available users for this survey
        // 1st - get productId and uoaId for this task
        var query1 =
            'SELECT '+
            '"Tasks"."uoaId", '+
            '"Tasks"."productId" '+
            'FROM '+
            '"Tasks" '+
            'WHERE '+
            '"Tasks"."id" = '+taskId;
        result = yield thunkQuery(query1);
        if (!_.first(result)) {
            throw new HttpError(403, 'Task with taskId=`'+taskId+'` does not exist'); // just in case - not possible case!
        }
        var productId = result[0].productId;
        var uoaId = result[0].uoaId;

        var query2 =
             'SELECT '+
             '"Users".id '+
             'FROM '+
             '"Tasks" '+
             'INNER JOIN "EssenceRoles" ON "Tasks"."entityTypeRoleId" = "EssenceRoles"."id" '+
             'INNER JOIN "Users" ON "EssenceRoles"."userId" = "Users"."id" '+
             'WHERE '+
             '"Tasks"."productId" = '+productId+' AND '+
             '"Tasks"."uoaId" = '+uoaId;
        result = yield thunkQuery(query2);
        if (!_.first(result)) {
            throw new HttpError(403, 'No available users for this survey'); // just in case - I think, it is not possible case!
        }
        var userList=[];
        result.forEach(function(item, i, arr) {
                userList.push(item.id);
            }
        );
        if (userList.indexOf(parseInt(userId)) == -1) {
            throw new HttpError(403, 'User with userId=`'+userId+'` does not available user for this survey');
        }

    }
    return parseInt(userId);
}

function* getTaskId(id) {
    var result;
    var query1 =
        'SELECT '+
        '"Discussions"."taskId" '+
        'FROM '+
        '"Discussions" '+
        'WHERE '+
        '"Discussions"."id" = '+id;
        result = yield thunkQuery(query1);
    if (!_.first(result)) {
        throw new HttpError(403, 'Entry with id=`'+id+'` does not exist in discussions'); // just in case - not possible case!
    }
    return result[0].taskId;
}

function* checkString(val, keyName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    return val;
}

function* checkInsert(req) {
    var questionId = yield * checkOneId(req.body.questionId, SurveyQuestion, 'id', 'questionId', 'Question');
    var taskId = yield * checkOneId(req.body.taskId, Task, 'id', 'taskId', 'Task');
    var userId = yield * checkUserId(req.body.userId, req.body.taskId);
    var entry = yield * checkString(req.body.entry, 'Entry');
}

function* checkUpdate(req) {
    var taskId = yield * getTaskId(req.params.id);
    var userId = yield * checkUserId(req.body.userId, taskId);
    var entry = yield * checkString(req.body.entry, 'Entry');
}
