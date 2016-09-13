var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    sTask = require('app/services/tasks'),
    sTaskUserState = require('app/services/taskuserstates'),
    sWorkflow = require('app/services/workflows'),
    Workflow = require('app/models/workflows'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    WorkflowStep = require('app/models/workflow_steps'),
    WorkflowStepGroup = require('app/models/workflow_step_groups'),
    Task = require('app/models/tasks'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_workflows');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(Workflow.select().from(Workflow), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var data = yield thunkQuery(
                Workflow.select().where(Workflow.id.equals(req.params.id))
            );
            if (!_.first(data)) {
                throw new HttpError(404, 'Not found');
            }
        }).then(function (data) {
            res.status(200).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkData(req);
            var result = yield thunkQuery(Workflow.update(req.body).where(Workflow.id.equals(req.params.id)));
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'workflows',
                entity: req.params.id,
                info: 'Update workflow'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Workflow.delete().where(Workflow.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'workflows',
                entity: req.params.id,
                info: 'Delete workflow'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkData(req);
            var result = yield thunkQuery(Workflow.insert(req.body).returning(Workflow.id));
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'workflows',
                entity: _.first(data).id,
                info: 'Add new workflow'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    steps: function (req, res, next) {
        var oWorkflow = new sWorkflow(req);
        co(function* () {
            return yield oWorkflow.getSteps(req.params.id);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    stepsUpdate: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var oWorkflow = new sWorkflow(req);
        var oTask = new sTask(req);
        var oTaskUserState = new sTaskUserState(req);
        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of workflow steps objects in request body');
            }

            var workflow = yield thunkQuery(Workflow.select().where(Workflow.id.equals(req.params.id)));
            if (!_.first(workflow)) {
                throw new HttpError(403, 'Workflow with id = ' + req.params.id + ' does not exist');
            }

            var rels = yield thunkQuery(WorkflowStep.select().where(WorkflowStep.workflowId.equals(req.params.id)));
            var relIds = rels.map(function (value) {
                return value.id;
            });

            var passedIds = [];
            var updatedIds = [];
            var insertIds = [];
            var usersIds, tasks;

            for (var i in req.body) {
                var updateObj = _.pick(req.body[i], WorkflowStep.editCols);
                if (req.body[i].id) { // need update
                    passedIds.push(req.body[i].id);
                    if (Object.keys(updateObj).length && relIds.indexOf(req.body[i].id) !== -1) { // have data to update  and exists
                        updatedIds.push(req.body[i].id);
                        yield oWorkflow.updateWorkflowStep(req.body[i].id, updateObj, req.user);
                        yield oWorkflow.deleteWorkflowStepGroups(req.body[i].id, req.user);
                    }
                } else {
                    var insertObj = _.pick(req.body[i], WorkflowStep.table._initialConfig.columns);
                    insertObj.workflowId = req.params.id;
                    var insertId = yield oWorkflow.insertWorkflowStep(insertObj, req.user);
                    insertIds.push(insertId[0].id);
                    req.body[i].id = insertId[0].id;
                }
                var insertGroupObjs = [];
                for (var groupIndex in req.body[i].usergroupId) {
                    insertGroupObjs.push({
                        stepId: req.body[i].id,
                        groupId: req.body[i].usergroupId[groupIndex]
                    });
                }
                debug(insertGroupObjs);
                if (insertGroupObjs.length) {
                    yield oWorkflow.insertWorkflowStepGroups(insertGroupObjs);
                }
            }

            var deleteIds = _.difference(relIds, passedIds);

            for (i in deleteIds) {
                var hasAssignedTasks = yield oWorkflow.hasAssignedTasks(deleteIds[i]);
                if(hasAssignedTasks) {
                    throw new HttpError(403, 'You can not remove workflow step (id=`' + deleteIds[i] + '`) that have task with assigned users.');
                }
                var task = yield oWorkflow.getTaskByStep(deleteIds[i], true);
                if (task) {
                    yield oTaskUserState.remove(task.id);   // just in case
                    yield oTask.deleteTask(task.id);
                }
                yield oWorkflow.deleteWorkflowStepGroups(deleteIds[i], req.user);
                yield oWorkflow.deleteWorkflowStep(deleteIds[i]);
            }

            return {
                deleted: deleteIds,
                updated: updatedIds,
                inserted: insertIds.map(function (value) {
                    return value.id;
                })
            };

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    }

};

function* checkData(req) {
    var thunkQuery = req.thunkQuery;
    var product = yield thunkQuery(Product.select().where(Product.id.equals(req.body.productId)));
    if (!_.first(product)) {
        throw new HttpError(403, 'Product with id = ' + req.body.productId + ' does not exist');
    }

    var relError = false;
    var productRel;
    if (req.params.id) { //update
        if (req.body.productId) {
            productRel = yield thunkQuery(Workflow.select().where(Workflow.productId.equals(req.body.productId).and(Workflow.id.notEquals(req.params.id))));
            if (_.first(productRel)) {
                relError = true;
            }
        }
    } else { //create
        productRel = yield thunkQuery(Workflow.select().where(Workflow.productId.equals(req.body.productId)));
        if (_.first(productRel)) {
            relError = true;
        }
    }

    if (relError) {
        throw new HttpError(403, 'Product with id = ' + req.body.productId + ' has already assigned to another workflow');
    }

}

function* setCurrentStepToNull(req, productId) {
    var thunkQuery = req.thunkQuery;
    // update all currentStepId to NULL for specified productId (for every UOA)

    var result = yield thunkQuery(
        ProductUOA
        .update({
            currentStepId: null
        })
        .where(ProductUOA.productId.equals(productId))
    );

}
