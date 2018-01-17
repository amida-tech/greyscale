var
    _ = require('underscore'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    common = require('../services/common'),
    Product = require('../models/products'),
    Project = require('../models/projects'),
    WorkflowStep = require('../models/workflow_steps'),
    Discussions = require('../models/discussions'),
    Task = require('../models/tasks'),
    User = require('../models/users'),
    co = require('co'),
    sql = require('sql'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    ProductUOA = require('../models/product_uoa'),
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_products');

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                Task
                .select(
                    Task.star()
                )
                .from(
                    Task
                )
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    /**
     * Retrieves and returns a list of tasks and their associated discussions using a given project ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Express next middleware function
     * @return {List} List of tasks with corresponding discussions
     */
    getTasksByProjectId: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            const projectExist = yield * common.checkRecordExistById(req, 'Projects', 'id', req.params.id)

            if (projectExist === true) {
                var tasks = yield thunkQuery(
                    Task
                        .select(
                            Task.star()
                        )
                        .from(
                            Task
                                .leftJoin(Product)
                                .on(Product.id.equals(Task.productId))
                                .leftJoin(Project)
                                .on(Project.id.equals(Product.projectId))
                        )
                        .where(Project.id.equals(req.params.id)
                            .and(Task.isDeleted.isNull()))
                );

                if (!_.first(tasks)) {
                    throw new HttpError(204, 'No Tasks Found');
                }

                return yield * common.getFlagsForTask(req, tasks);

            } else {
                throw new HttpError(400, 'No project matching that project ID');
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    /**
     * Retrieves and returns a list of tasks and their associated project id's using a given user ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Express next middleware function
     * @return {List} List of tasks with corresponding project ID's
     */
    getTasksByUserId: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            // Check if user exist
            var user = yield thunkQuery(
                '(' +
                'SELECT ' +
                '"Users"."id" ' +
                'FROM "Users" ' +
                'WHERE "Users"."id" = ' + req.params.id +
                ') '
            );

            if (!_.first(user)) {
                throw new HttpError(403, 'User Not found');
            }

            var tasks = yield thunkQuery(
                '( '+
                'SELECT "Tasks".*, "Products"."projectId", "Products"."surveyId" ' +
                'FROM "Tasks" ' +
                'LEFT JOIN "Products" ' +
                'ON "Products"."id" = "Tasks"."productId" ' +
                'LEFT JOIN "Projects" ' +
                'ON "Projects"."id" = "Products"."id" ' +
                'WHERE ' + req.params.id + ' = ANY("Tasks"."userIds") ' +
                'AND "Tasks"."isDeleted" is NULL ' +
                ') '
            );

            if (!_.first(tasks)) {
                res.status(204).end();
            }

            return tasks;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    /**
     * Retrieves and returns a list of tasks and their associated project id's
     * using a the current user ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Express next middleware function
     * @return {List} List of tasks with corresponding user's ID
     */
    getSelfTasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var tasks = yield thunkQuery(
                '( ' +
                'SELECT "Tasks".*, "Products"."projectId", "Products"."surveyId" ' +
                'FROM "Tasks" ' +
                'LEFT JOIN "Products" ' +
                'ON "Products".id = ' +
                '"Tasks"."productId" ' +
                'LEFT JOIN "Projects" ' +
                'ON "Projects".id ' +
                '= "Products".id ' +
                'WHERE ' + req.user.id + ' = ANY("Tasks"."userIds")' +
                'AND "Tasks"."isDeleted" is NULL ' +
                ') '
            );
            return yield * common.getFlagsForTask(req, tasks);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var curStepAlias = 'curStep';
            var task = yield thunkQuery(
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
                    .leftJoin(Discussions)
                    .on(Discussions.taskId.equals(req.params.id))
                )
                .where(Task.id.equals(req.params.id)
                    .and(Task.isDeleted.isNull()))
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

    // INBA-484
    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                'UPDATE "Tasks"' +
                ' SET "isDeleted" = (to_timestamp('+ Date.now() +
                '/ 1000.0)) WHERE "id" = ' + req.params.id
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
            res.status(204).json(true);
        }, function (err) {
            next(err);
        }).then(function (data) {
            const project_id = 1;
            bologger.log({
                req: req,
                user: req.user,
                action: 'task_deleted',
                object: 'projects',
                entity: project_id,
                info: 'Task deleted'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    // INBA-484
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
        }).then(function (data) {
            const project_id = 1;
            bologger.log({
                req: req,
                user: req.user,
                action: 'task_updated',
                object: 'projects',
                entity: project_id,
                info: 'Task updated'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    // INBA-484
    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkTaskData(req);
            req.body = yield * common.prepUsersForTask(req, req.body);

            var result = yield thunkQuery(
                Task
                .insert(
                    _.pick(req.body, Task.table._initialConfig.columns)
                )
                .returning(Task.id)
            );

            var log = {
                req: req,
                user: req.user,
                action: 'update',
                object: 'ProductUOA',
            }

            var step = yield * updateCurrentStepId(req, _.first(result).id);
            if (typeof currentStep === 'object') {
                log.entities = step;
                log.quantity = 1;
                log.info = 'Update currentStep to `' + step.currentStepId + '` for product `' + step.productId + '` (for all subjects)';
            } else {
                log.entitites = null;
                log.info = 'Error update currentStep for product `' + (req.body.productId || req.params.id) + '` (Not found step ID or min step position)';
            }

            bologger.log(log);
            return result;

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
        }).then(function (data) {
            const project_id = 1;
            bologger.log({
                req: req,
                user: req.user,
                action: 'task_inserted',
                object: 'projects',
                entity: req.params.id,
                info: 'Task inserted'
            });
            res.status(204).end();
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

function* updateCurrentStepId(req, insertedTaskId) {
    var thunkQuery = req.thunkQuery;

    var product = yield * common.getEntity(req, req.body.productId, Product, 'id');
    if (product.status !== 2) { // not suspended
        yield thunkQuery(
            ProductUOA.update({
                isComplete: false
            }).where(ProductUOA.productId.equals(req.body.productId))
        );
    }

    var result;
    var minStepPositionQuery = WorkflowStep
        .select(
            WorkflowStep.position,
            Task.stepId,
            Task.id
        )
        .from(WorkflowStep
            .join(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
        .where(Task.productId.equals(req.body.productId))
        .and(Task.uoaId.equals(req.body.uoaId))
        .and(WorkflowStep.isDeleted.isNull())
        .order(WorkflowStep.position);
    result = yield thunkQuery(minStepPositionQuery);

    if (!_.first(result)) {
        throw new HttpError(403, 'Could not find the min step position for productId: ' + req.body.productId );
    }

    var addedStep = _.find(result, (step) => step.id === insertedTaskId);
    var currentStep = _.first(yield thunkQuery(ProductUOA
        .select(
            WorkflowStep.position,
            ProductUOA.currentStepId
        )
        .from(ProductUOA.join(WorkflowStep).on(ProductUOA.currentStepId.equals(WorkflowStep.id)))
        .where(ProductUOA.productId.equals(req.body.productId))
        .and(ProductUOA.UOAid.equals(req.body.uoaId))));

    if (!currentStep || addedStep.position < currentStep.position) {
        yield thunkQuery(ProductUOA
            .update({
                currentStepId: addedStep.stepId
            })
            .where(ProductUOA.productId.equals(req.body.productId)
                .and(ProductUOA.UOAid.equals(req.body.uoaId))
            )
        );
    }
        // TODO: Notify user, INBA-529.

    return {
        productId: req.body.productId,
        currentSteps: addedStep
    };

}
