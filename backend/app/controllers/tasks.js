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
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    ProductUOA = require('app/models/product_uoa'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
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
            var curStepAlias = 'curStep';
            var task = yield thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
                        'WHEN (' +
                            'SELECT ' +
                            '"Discussions"."id" ' +
                            'FROM "Discussions" ' +
                            'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                            'AND "Discussions"."isReturn" = true ' +
                            'AND "Discussions"."isResolve" = false ' +
                            'LIMIT 1' +
                        ') IS NULL ' +
                        'THEN FALSE ' +
                        'ELSE TRUE ' +
                    'END as flagged',
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
                throw new HttpError(403, 'Not found');
            }
            return _.first(task);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var q = Task.delete().where(Task.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                Task
                .update(_.pick(req.body, Task.editCols))
                .where(Task.id.equals(req.params.id))
            );
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkTaskData(req);
            var result = yield thunkQuery(
                Task
                .insert(
                    _.pick(req.body, Task.table._initialConfig.columns)
                )
                .returning(Task.id)
            );
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

};

function* checkTaskData(req) {
    if (!req.params.id) {
        if (
            typeof req.body.uoaId === 'undefined' ||
            typeof req.body.stepId === 'undefined' ||
            typeof req.body.userId === 'undefined' ||
            typeof req.body.productId === 'undefined'
        ) {

            throw new HttpError(403, 'uoaId, stepId, userId, productId and title fields are required');
        }
    }

}
