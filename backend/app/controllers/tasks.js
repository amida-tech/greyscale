var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    common = require('app/services/common'),
    sTask = require('app/services/tasks'),
    Task = require('app/models/tasks'),
    co = require('co'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError;

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

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Task.delete().where(Task.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'tasks',
                entity: req.params.id,
                info: 'Delete task'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            req.body = yield * common.prepUsersForTask(req, req.body);
            return yield thunkQuery(
                Task
                .update(_.pick(req.body, Task.editCols))
                .where(Task.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'tasks',
                entity: req.params.id,
                info: 'Update task'
            });
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
