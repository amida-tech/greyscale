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
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    ProductUOA = require('../models/product_uoa'),
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

            //TODO: Check if projects with given id exists first

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
                .where(Project.id.equals(req.params.id))
            );

            if (!_.first(tasks)) {
                throw new HttpError(403, 'Not found');
            }

            return yield * common.getFlagsForTask(req, tasks);

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
                ') '
            );

            if (!_.first(tasks)) {
                throw new HttpError(403, 'Not found');
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
                'SELECT "Tasks".*, "Products"."projectId", "Products"."surveyId" ' +
                'FROM "Tasks" LEFT JOIN "Products" ON "Products".id = ' +
                '"Tasks"."productId" LEFT JOIN "Projects" ON "Projects".id ' +
                '= "Products".id WHERE ' + req.user.id + ' = ANY("Tasks"."userIds")'
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
