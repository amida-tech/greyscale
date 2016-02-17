var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    Workflow = require('app/models/workflows'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    WorkflowStep = require('app/models/workflow_steps'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Workflow.select().from(Workflow), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        query(Workflow.select().where(Workflow.id.equals(req.params.id)), function (err, data) {
            if (err) {
                return next(err);
            }
            if (!_.first(data)) {
                return next(new HttpError(404, 'Not found'));
            }
            res.status(200).json(_.first(data));
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkData(req);
            var result = yield thunkQuery(Workflow.update(req.body).where(Workflow.id.equals(req.params.id)));
            return result;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        query(Workflow.delete().where(Workflow.id.equals(req.params.id)), function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkData(req);
            var result = yield thunkQuery(Workflow.insert(req.body).returning(Workflow.id));
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    steps: function (req, res, next) {
        co(function* () {
            var q = WorkflowStep
                .select()
                .where(WorkflowStep.workflowId.equals(req.params.id));
            if (!req.query.order) {
                q = q.order(WorkflowStep.position)
            }
            return yield thunkQuery(q);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    stepsUpdate: function (req, res, next) {
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

            var deleteQ = WorkflowStep.delete();
            var insertArr = [];
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
                    }
                } else {
                    var insertObj = _.pick(req.body[i], WorkflowStep.table._initialConfig.columns);
                    insertObj.workflowId = req.params.id;
                    insertArr.push(insertObj);
                }
            }

            var deleteIds = _.difference(relIds, passedIds);

            for (var j in deleteIds) {
                deleteQ = deleteQ.or({
                    id: deleteIds[j]
                });
            }

            if (deleteIds.length) {
                yield thunkQuery(deleteQ);
            }

            if (insertArr.length) {
                insertIds = yield thunkQuery(WorkflowStep.insert(insertArr).returning(WorkflowStep.id));
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

    },
    /*
    stepsAdd: function (req, res, next) {
        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of step ids in request body');
            }

            var workflow = yield thunkQuery(Workflow.select().where(Workflow.id.equals(req.params.id)));
            if (!_.first(workflow)) {
                throw new HttpError(403, 'Workflow with id = ' + req.params.id + ' does not exist');
            }

            var result = yield thunkQuery(WorkflowStepList.select(WorkflowStepList.id).where(WorkflowStepList.id.in(req.body)));
            var stepsInList = result.map(function (value) {
                return value.id;
            });

            result = yield thunkQuery(WorkflowStep.select(WorkflowStep.stepId).where(WorkflowStep.workflowId.equals(req.params.id)));
            var stepsInRel = result.map(function (value) {
                return value.stepId;
            });

            var insertArr = [];

            for (var i in req.body) {
                if (stepsInList.indexOf(req.body[i]) === -1) {
                    throw new HttpError(403, 'Workflow step with id = ' + req.body[i] + ' does not exist');
                }
                if (stepsInRel.indexOf(req.body[i]) > -1) {
                    throw new HttpError(403, 'Relation for workflow step with id = ' + req.body[i] + ' has already existed');
                }
                insertArr.push({
                    workflowId: req.params.id,
                    stepId: req.body[i]
                });
            }

            return yield thunkQuery(WorkflowStep.insert(insertArr));
        }).then(function (data) {
            res.status(201).end();
        }, function (err) {
            next(err);
        });
    },


    stepListSelect: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(WorkflowStepList.select().from(WorkflowStepList));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    stepListAdd: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(WorkflowStepList.insert(req.body).returning(WorkflowStepList.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    stepListSelectOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(WorkflowStepList.select().from(WorkflowStepList).where(WorkflowStepList.id.equals(req.params.id)));
            if (!_.first(result)) {
                throw new HttpError(404, 'Not found');
            }
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    stepListUpdateOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(WorkflowStepList.update(req.body).where(WorkflowStepList.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    stepListDelete: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(WorkflowStepList.delete().where(WorkflowStepList.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },
    */

};

function* checkData(req) {
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
