var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Workflow = require('app/models/workflows'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    WorkflowStep = require('app/models/workflow_steps'),
    WorkflowStepGroup = require('app/models/workflow_step_groups'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_workflows');

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

        co(function* (){
            var data = yield thunkQuery(
                Workflow.select().where(Workflow.id.equals(req.params.id))
            );
            if (!_.first(data)) {
                 throw new HttpError(404, 'Not found');
            }
        }).then(function(data){
            res.status(200).json(_.first(data));
        }, function(err){
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
                user: req.user.id,
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

        co(function*(){
            return yield thunkQuery(
                Workflow.delete().where(Workflow.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user.id,
                action: 'delete',
                object: 'workflows',
                entity: req.params.id,
                info: 'Delete workflow'
            });
            res.status(204).end();
        }, function(err){
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
                user: req.user.id,
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var q = WorkflowStep
                .select(
                    WorkflowStep.star(),
                    'array(' +
                    'SELECT "WorkflowStepGroups"."groupId" ' +
                    'FROM "WorkflowStepGroups" ' +
                    'WHERE "WorkflowStepGroups"."stepId" = "WorkflowSteps"."id"' +
                    ') as "usergroupId"'
                )
                .from(WorkflowStep)
                .where(WorkflowStep.workflowId.equals(req.params.id));
            if (!req.query.order) {
                q = q.order(WorkflowStep.position);
            }
            return yield thunkQuery(q);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    stepsUpdate: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of workflow steps objects in request body');
            }

            var workflow = yield thunkQuery(Workflow.select().where(Workflow.id.equals(req.params.id)));
            if (!_.first(workflow)) {
                throw new HttpError(403, 'Workflow with id = ' + req.params.id + ' does not exist');
            }
            var productId = workflow[0].productId;

            var rels = yield thunkQuery(WorkflowStep.select().where(WorkflowStep.workflowId.equals(req.params.id)));
            var relIds = rels.map(function (value) {
                return value.id;
            });


            var passedIds = [];
            var updatedIds = [];
            var insertIds = [];

            for (var i in req.body) {
                var updateObj = _.pick(req.body[i], WorkflowStep.editCols);
                if (req.body[i].id) { // need update
                    passedIds.push(req.body[i].id);
                    if (Object.keys(updateObj).length && relIds.indexOf(req.body[i].id) !== -1) { // have data to update  and exists
                        updatedIds.push(req.body[i].id);
                        yield thunkQuery(
                            WorkflowStep
                            .update(updateObj)
                            .where(WorkflowStep.id.equals(req.body[i].id))
                        );
                        bologger.log({
                            req: req,
                            user: req.user.id,
                            action: 'update',
                            object: 'workflowsteps',
                            entity: req.body[i].id,
                            info: 'Update workflow step'
                        });
                        yield thunkQuery(
                            WorkflowStepGroup.delete().where(WorkflowStepGroup.stepId.equals(req.body[i].id))
                        );
                        bologger.log({
                            req: req,
                            user: req.user.id,
                            action: 'update',
                            object: 'workflowstepgroups',
                            info: 'Delete all workflow step groups for step '+ req.body[i].id
                        });
                    }
                } else {
                    var insertObj = _.pick(req.body[i], WorkflowStep.table._initialConfig.columns);
                    insertObj.workflowId = req.params.id;
                    var insertId = yield thunkQuery(WorkflowStep.insert(insertObj).returning(WorkflowStep.id));
                    insertIds.push(insertId[0].id);
                    req.body[i].id = insertId[0].id;
                    //insertArr.push(insertObj);
                    bologger.log({
                        req: req,
                        user: req.user.id,
                        action: 'insert',
                        object: 'workflowsteps',
                        entity: req.body[i].id,
                        info: 'Insert workflow step'
                    });
                }
                var insertGroupObjs = [];
                for (var groupIndex in req.body[i].usergroupId) {
                    insertGroupObjs.push(
                        {
                            stepId : req.body[i].id,
                            groupId: req.body[i].usergroupId[groupIndex]
                        }
                    );
                }
                debug(insertGroupObjs);
                if (insertGroupObjs.length) {
                    yield thunkQuery(WorkflowStepGroup.insert(insertGroupObjs));
                    bologger.log({
                        req: req,
                        user: req.user.id,
                        action: 'insert',
                        object: 'workflowstepgroups',
                        entities: insertGroupObjs,
                        quantity: insertGroupObjs.length,
                        info: 'Insert workflow step group(s)'
                    });
                }
            }

            var deleteIds = _.difference(relIds, passedIds);

            for (var i in deleteIds) {
                yield thunkQuery(WorkflowStepGroup.delete().where(WorkflowStepGroup.stepId.equals(deleteIds[i])));
                bologger.log({
                    req: req,
                    user: req.user.id,
                    action: 'delete',
                    object: 'workflowstepgroups',
                    entities: deleteIds,
                    quantity: deleteIds.length,
                    info: 'Delete workflow step group(s)'
                });
                yield thunkQuery(WorkflowStep.delete().where(WorkflowStep.id.equals(deleteIds[i])));
                bologger.log({
                    req: req,
                    user: req.user.id,
                    action: 'delete',
                    object: 'workflowsteps',
                    entities: deleteIds,
                    quantity: deleteIds.length,
                    info: 'Delete workflow step(s)'
                });
            }

            // var result = yield * setCurrentStepToNull(req, productId); - not required, as User could require to adjust certain Step's permissions for running Project

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

    result = yield thunkQuery(
        ProductUOA
            .update({currentStepId: null})
            .where(ProductUOA.productId.equals(productId))
    );

}
