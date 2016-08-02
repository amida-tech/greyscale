var
    _ = require('underscore'),
    common = require('app/services/common'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    notifications = require('app/controllers/notifications'),
    ProductUOA = require('app/models/product_uoa'),
    Product = require('app/models/products'),
    Survey = require('app/models/surveys'),
    Project = require('app/models/projects'),
    Task = require('app/models/tasks'),
    WorkflowStep = require('app/models/workflow_steps'),
    sTask = require('app/services/tasks'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError;

var debug = require('debug')('debug_product_service');
var error = require('debug')('error');
debug.log = console.log.bind(console);


var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }
    this.addProductUoa = function (productId, uoaId) {
        return co(function* () {
            yield thunkQuery(
                ProductUOA.insert({
                    productId: productId,
                    UOAid: uoaId
                })
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: productId,
                    uoaId: uoaId
                },
                quantity: 1,
                info: 'Add subject `' + uoaId + '` for product `' + productId + '`'
            });
        });
    };
    this.deleteProductUoa = function (productId, uoaId) {
        return co(function* () {
            yield thunkQuery(
                ProductUOA.delete().where({
                    productId: productId,
                    UOAid: uoaId
                })
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: productId,
                    uoaId: uoaId
                },
                quantity: 1,
                info: 'Delete subject `' + uoaId + '` for product `' + productId + '`'
            });
        });
    };
    this.deleteProductAllUoas = function (productId) {
        return co(function* () {
            yield thunkQuery(
                ProductUOA.delete().where({
                    productId: productId
                })
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: productId
                },
                quantity: 1,
                info: 'Delete all subjects for product `' + productId + '`'
            });
        });
    };
    this.insertProduct = function () {
        return co(function* () {
            var product = yield thunkQuery(
                Product
                    .insert(_.pick(req.body, Product.table._initialConfig.columns))
                    .returning(Product.id)
            );
            if (_.first(product)) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'products',
                    entity: _.first(product).id,
                    info: 'Add new product'
                });
                return _.first(product).id;
            }
        });
    };
    this.updateProduct = function () {
        return co(function* () {
            yield thunkQuery(
                Product
                    .update(_.pick(req.body, Product.editCols))
                    .where(Product.id.equals(req.params.id))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'products',
                entity: req.params.id,
                info: 'Update product'
            });
        });
    };
    this.checkProductData = function() {
        return co(function* () {
            if (!req.params.id) { // create
                if (!req.body.projectId) {
                    throw new HttpError(403, 'Project id fields are required');
                }
            }

            if (typeof req.body.status !== 'undefined') {
                if (typeof Product.statuses[req.body.status] === 'undefined') {
                    throw new HttpError(
                        403,
                        'Status can be only: ' + JSON.stringify(Product.statuses)
                    );
                }
            }

            if (req.body.surveyId) {
                var isExistSurvey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.body.surveyId)));
                if (!_.first(isExistSurvey)) {
                    throw new HttpError(403, 'Survey with id = ' + req.body.surveyId + ' does not exist');
                }
            }

            if (req.body.projectId) {
                var isExistProject = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
                if (!_.first(isExistProject)) {
                    throw new HttpError(403, 'Project with this id does not exist');
                }
            }
        });
    };
    this.updateCurrentStepId = function(product) {
        var self = this;
        return co(function* () {
            //var product = yield * common.getEntity(req, req.params.id, Product, 'id');

            debug('Product status: '+ Product.statuses[product.status]);

            // start-restart project -> set isComplete flag to false for all subjects
            if (product.status !== 2) { // not suspended
                yield thunkQuery(
                    ProductUOA.update({
                        isComplete: false
                    }).where(ProductUOA.productId.equals(req.params.id))
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'ProductUOA',
                    entities: {productId : req.params.id},
                    quantity: 1,
                    info: 'Set isComplete flag to false (for all subjects) for product `' + req.params.id + '`'
                });
            }

            var result;
            // get min step position for each productId-uoaId
            var minStepPositionQuery = WorkflowStep
                .select(
                sql.functions.MIN(WorkflowStep.position).as('minPosition'),
                Task.uoaId
            )
                .from(WorkflowStep
                    .join(Task).on(Task.stepId.equals(WorkflowStep.id))
            )
                .where(Task.productId.equals(req.params.id))
                .group(Task.uoaId);

            result = yield thunkQuery(minStepPositionQuery);
            if (!_.first(result)) {
                debug('Not found min step position for productId `' + req.params.id + '`');
                return null;
            }
            var minStepPositions = result;

            // get step ID with min step position for specified productId and each uoaId
            for (var i = 0; i < minStepPositions.length; i++) {
                var nextStep = yield thunkQuery(
                    WorkflowStep
                        .select(
                        WorkflowStep.id,
                        Task.id.as('taskId')
                    )
                        .from(WorkflowStep
                            .join(Task).on(Task.stepId.equals(WorkflowStep.id))
                    )
                        .where(Task.productId.equals(req.params.id)
                            .and(Task.uoaId.equals(minStepPositions[i].uoaId))
                            .and(WorkflowStep.position.equals(minStepPositions[i].minPosition))
                    )
                );
                if (_.first(nextStep)) {
                    minStepPositions[i].stepId = nextStep[0].id;
                    minStepPositions[i].taskId = nextStep[0].taskId;

                    // update all currentStepId with min position step ID for specified productId for each subject
                    //
                    if (product.status !== 2) { // not suspended
                        result = yield thunkQuery(ProductUOA
                                .update({
                                    currentStepId: minStepPositions[i].stepId
                                })
                                .where(ProductUOA.productId.equals(req.params.id)
                                    .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                            )
                        );
                        bologger.log({
                            req: req,
                            user: req.user,
                            action: 'update',
                            object: 'ProductUOA',
                            entities: {
                                currentStepId: minStepPositions[i].stepId,
                                productId: req.params.id,
                                UOAid: minStepPositions[i].uoaId
                            },
                            quantity: 1,
                            info: 'Update currentStep to `' + minStepPositions[i].stepId + '` for product `' + req.params.id + '` for subject `' + minStepPositions[i].uoaId +'`'
                        });
                    } else {
                        var result1 = yield thunkQuery(
                            ProductUOA
                                .select()
                                .where(ProductUOA.productId.equals(req.params.id)
                                    .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                                    .and(ProductUOA.currentStepId.isNull())
                            )
                        );
                        if (_.first(result1)) {
                            result = yield thunkQuery(ProductUOA
                                    .update({
                                        currentStepId: minStepPositions[i].stepId
                                    })
                                    .where(ProductUOA.productId.equals(req.params.id)
                                        .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                                )
                            );
                            bologger.log({
                                req: req,
                                user: req.user,
                                action: 'update',
                                object: 'ProductUOA',
                                entities: {
                                    currentStepId: minStepPositions[i].stepId,
                                    productId: req.params.id,
                                    UOAid: minStepPositions[i].uoaId
                                },
                                quantity: 1,
                                info: 'Update currentStep to `' + minStepPositions[i].stepId + '` for product `' + req.params.id + '` for subject `' + minStepPositions[i].uoaId +'`'
                            });
                        }
                    }

                    // notify
                    var task = yield * common.getTask(req, parseInt(minStepPositions[i].taskId));
                    self.notify({
                        body: 'Task activated (project started)',
                        action: 'Task activated (project started)'
                    }, task.id, task.id, 'Tasks', 'activateTask');
                }
            }

            return {
                productId: req.params.id,
                currentSteps: minStepPositions
            };
        });
    };
    this.notify = function (note0, entryId, taskId, essenceName, templateName) {
        co(function* () {
            var userTo, note;
            // notify
            var sentUsersId = []; // array for excluding duplicate sending
            var task = yield * common.getTask(req, taskId);
            for (var i in task.userIds) {
                if (sentUsersId.indexOf(task.userIds[i]) === -1) {
                    if (req.user.id !== task.userIds[i]) { // don't send self notification
                        userTo = yield * common.getUser(req, task.userIds[i]);
                        note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                        notifications.notify(req, userTo, note, templateName);
                        sentUsersId.push(task.userIds[i]);
                    }
                }
            }
            for (i in task.groupIds) {
                var usersFromGroup = yield * common.getUsersFromGroup(req, task.groupIds[i]);
                for (var j in usersFromGroup) {
                    if (sentUsersId.indexOf(usersFromGroup[j].userId) === -1) {
                        if (req.user.id !== usersFromGroup[j].userId) { // don't send self notification
                            userTo = yield * common.getUser(req, usersFromGroup[j].userId);
                            note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                            notifications.notify(req, userTo, note, templateName);
                            sentUsersId.push(usersFromGroup[j].userId);
                        }
                    }
                }
            }
        }).then(function (result) {
            debug('Created notifications `' + note0.action + '`');
        }, function (err) {
            error(JSON.stringify(err));
        });
    };
};

module.exports = exportObject;
