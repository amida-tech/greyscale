const
    _ = require('underscore'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    common = require('../services/common'),
    Product = require('../models/products'),
    WorkflowStep = require('../models/workflow_steps'),
    Task = require('../models/tasks'),
    co = require('co'),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    ProductUOA = require('../models/product_uoa');
module.exports = {
    //Don't think this is even being used.
    select: function (req, res, next) {

        co(function* () {
           return yield Task.all(req.thunkQuery);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },
    selectOne: function (req, res, next) {
        co(function* () {
            //TODO: Put operation below in a service. Something like module.currentStepTasks()
            var curStepAlias = 'curStep';
            var task = yield req.thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
                    'WHEN ' +
                    '(' +
                    'SELECT ' +
                    '"Discussions"."id" ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isReturn" = true ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'AND "Discussions"."activated" = true ' +
                    'LIMIT 1' +
                    ') IS NULL ' +
                    'THEN FALSE ' +
                    'ELSE TRUE ' +
                    'END as flagged',
                    '( ' +
                    'SELECT count("Discussions"."id") ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isReturn" = true ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'AND "Discussions"."activated" = true ' +
                    ') as flaggedCount',
                    '(' +
                    'SELECT ' +
                    '"Discussions"."taskId" ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isReturn" = true ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'AND "Discussions"."activated" = true ' +
                    'LIMIT 1' +
                    ') as flaggedFrom',
                    'CASE ' +
                    'WHEN ' +
                    '("' + curStepAlias + '"."position" > "WorkflowSteps"."position") ' +
                    'OR ("ProductUOA"."isComplete" = TRUE) ' +
                    'THEN \'completed\' ' +
                    'WHEN (' +
                    '"' + curStepAlias + '"."position" IS NULL ' +
                    'AND ("WorkflowSteps"."position" = 0) ' +
                    'AND ("Products"."status" = 1)' +
                    ')' +
                    'OR (' +
                    '"' + curStepAlias + '"."position" = "WorkflowSteps"."position" ' +
                    'AND ("Products"."status" = 1)' +
                    ')' +
                    'THEN \'current\' ' +
                    'ELSE \'waiting\'' +
                    'END as status '
                )
                .from(
                    Task
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))
                    .leftJoin(ProductUOA)
                    .on(
                        ProductUOA.productId.equals(Task.productId)
                        .and(ProductUOA.UOAid.equals(Task.uoaId))
                    )
                    .leftJoin(WorkflowStep.as(curStepAlias))
                    .on(
                        ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                    )
                )
                .where(Task.id.equals(req.params.id))
            );

            if (!_.first(task)) {
                throw new HttpError(403, 'Item with that ID does not exist.');
            }
          return task;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        co(function* () {
            return yield Task.destroy(req.thunkQuery, req.params.id);
        }).then(function () {
          //TODO: refactor this bullshit into a service.
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'tasks',
                entity: req.params.id,
                info: 'Delete task'
            });
          //End bullshit.
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
        }).then(function () {
          //TODO: refactor this into a service ( see above )
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
        co(function* () {
            yield * validateBodyParams(req);
            let validatedParams = yield * common.prepUsersForTask(req, req.body);
            return yield Task.create(req.thunkQuery, validatedParams);
        }).then(function (data) {
          //TODO: refactor this into a service ( see above ).
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

function validateBodyParams(req) {
    if (!req.params.id) {
        if (
            typeof req.body.uoaId === 'undefined' ||
            typeof req.body.stepId === 'undefined' ||
            typeof req.body.productId === 'undefined'
        ) {
            throw new HttpError(403, 'uoaId, stepId and productId fields are required');
        }
        return common.checkDuplicateTask(req, req.body.stepId, req.body.uoaId, req.body.productId);
    }
}
