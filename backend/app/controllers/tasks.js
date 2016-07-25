var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    common = require('app/services/common'),
    sTask = require('app/services/tasks'),
    sTaskUserState = require('app/services/taskuserstates'),
    Product = require('app/models/products'),
    Project = require('app/models/projects'),
    Workflow = require('app/models/workflows'),
    EssenceRole = require('app/models/essence_roles'),
    WorkflowStep = require('app/models/workflow_steps'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    ProductUOA = require('app/models/product_uoa'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                Task
                .select(
                    Task.star()
                    //'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Task
                    //.leftJoin(Workflow)
                    //.on(Product.id.equals(Workflow.productId))
                )
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var oTask = new sTask(req);
            var isPolicy = yield oTask.isPolicy(req.params.id);
            if (isPolicy) {
                var usersIds =  yield oTask.getUsersIdsByTask(req.params.id);
                var task = yield oTask.getTaskPolicy();
                task.userStatuses = yield oTask.getTaskUsersStatuses('Comments', usersIds, req.params.id);
                task.userStatuses = oTask.getNamedStatuses(task.userStatuses, 'status');
                var userStatus = _.find(task.userStatuses, function(item){
                    return (item.userId === req.user.id);
                });
                if (userStatus) {
                    task.userStatus = userStatus.status;
                }
                return task;
            } else {
                return yield oTask.getTaskSurvey();
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    start: function (req, res, next) {
        co(function* () {
            // TaskUserStates - start task for user
            var oTaskUserState = new sTaskUserState(req);
            oTaskUserState.start(req.params.id, req.user.id);
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    approve: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            // TaskUserStates - set state to approve
            var oTaskUserState = new sTaskUserState(req);
            oTaskUserState.approve(req.params.id, req.user.id);
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var oTask = new sTask(req);
        var oTaskUserState = new sTaskUserState(req);
        co(function* () {

            yield oTask.deleteTask(req.params.id);

            // modify initial TaskUserStates
            yield oTaskUserState.remove(req.params.id);

        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var oTask = new sTask(req);
        var oTaskUserState = new sTaskUserState(req);
        var usersIds, step; // for use with TaskUserStates

        co(function* () {
            req.body = yield * common.prepUsersForTask(req, req.body);
            yield thunkQuery(
                Task
                .update(_.pick(req.body, Task.editCols))
                .where(Task.id.equals(req.params.id))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'tasks',
                entity: req.params.id,
                info: 'Update task'
            });

            // modify initial TaskUserStates
            usersIds =  yield oTask.getUsersIdsByTask(req.params.id);
            step = yield * common.getStepByTask(req, req.params.id);
            yield oTaskUserState.modify(req.params.id, usersIds, step.endDate);

        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkTaskData(req);
            req.body = yield * common.prepUsersForTask(req, req.body);
            return yield thunkQuery(
                Task
                .insert(
                    _.pick(req.body, Task.table._initialConfig.columns)
                )
                .returning(Task.id)
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'tasks',
                entity: _.first(data).id,
                info: 'Add new task'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    }

};

function* checkTaskData(req) {
    var thunkQuery = req.thunkQuery;
    if (!req.params.id) {
        if (
            typeof req.body.uoaId === 'undefined' ||
            typeof req.body.stepId === 'undefined' ||
            //typeof req.body.userId === 'undefined' ||
            typeof req.body.productId === 'undefined'
        ) {
            throw new HttpError(403, 'uoaId, stepId and productId fields are required');
        }
        yield * common.checkDuplicateTask(req, req.body.stepId, req.body.uoaId, req.body.productId);
    }
}
