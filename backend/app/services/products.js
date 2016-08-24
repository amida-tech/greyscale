var
    _ = require('underscore'),
    common = require('app/services/common'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    notifications = require('app/controllers/notifications'),
    ProductUOA = require('app/models/product_uoa'),
    Product = require('app/models/products'),
    Workflow = require('app/models/workflows'),
    Policy = require('app/models/policies'),
    Organization = require('app/models/organizations'),
    Survey = require('app/models/surveys'),
    SurveyMeta = require('app/models/survey_meta'),
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

    this.getList = function (options) {
        return co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow',
                    'row_to_json("Surveys".*) as survey',
                    'row_to_json("Policies".*) as policy'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                    .leftJoin(SurveyMeta)
                    .on(Product.id.equals(SurveyMeta.productId))
                    .leftJoin(Survey)
                    .on(
                        Survey.id.equals(SurveyMeta.surveyId)
                            .and(
                                Survey.surveyVersion.in(
                                    Survey.as('subS')
                                        .subQuery()
                                        .select(Survey.as('subS').surveyVersion.max())
                                        .where(Survey.as('subS').id.equals(Survey.id))
                                )
                            )
                    )
                    .leftJoin(Policy)
                    .on(
                        Policy.surveyId.equals(Survey.id)
                            .and(Policy.surveyVersion.equals(Survey.surveyVersion))
                    )
                ),
                options
            );
        });
    };

    this.getById = function (id) {
        return co(function* () {
            var product = yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow',
                    'row_to_json("Surveys".*) as survey',
                    'row_to_json("Policies".*) as policy'
                )
                .from(
                    Product
                        .leftJoin(Workflow)
                        .on(Product.id.equals(Workflow.productId))
                        .leftJoin(SurveyMeta)
                        .on(Product.id.equals(SurveyMeta.productId))
                        .leftJoin(Survey)
                        .on(
                            Survey.id.equals(SurveyMeta.surveyId)
                                .and(
                                    Survey.surveyVersion.in(
                                        Survey.as('subS')
                                            .subQuery()
                                            .select(Survey.as('subS').surveyVersion.max())
                                            .where(Survey.as('subS').id.equals(Survey.id))
                                    )
                                )
                        )
                        .leftJoin(Policy)
                        .on(
                            Policy.surveyId.equals(Survey.id)
                                .and(Policy.surveyVersion.equals(Survey.surveyVersion))
                        )
                )
                .where(Product.id.equals(id))
            );
            return product[0] || false;
        });
    };

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

    this.insertProduct = function (data) {
        return co(function* () {
            var product = yield thunkQuery(
                Product
                    .insert(_.pick(data, Product.table._initialConfig.columns))
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

    this.checkProductData = function(data) {
        return co(function* () {
            if (!data.organizationId) {
                throw new HttpError(
                    403,
                    'Organization id is required'
                );
            } else {
                var org = yield thunkQuery(Organization.select().where(Organization.id.equals(data.organizationId)));
                if (!org.length) {
                    throw new HttpError(
                        403,
                        'Organization with id = ' + data.organizationId + ' does not exist'
                    );
                }
            }

            if (typeof data.status !== 'undefined') {
                if (typeof Product.statuses[data.status] === 'undefined') {
                    throw new HttpError(
                        403,
                        'Status can be only: ' + JSON.stringify(Product.statuses)
                    );
                }
            }
        });
    };

    this.checkMultipleProjects = function(surveyId, policyId) {
        return co(function* () {
            if (policyId) {
                var products = yield thunkQuery(Product.select().where(Product.surveyId.equals(surveyId)));
                if (products.length) {
                    throw new HttpError(403, 'Policy cannot be assigned to multiple projects');
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
        var self = this;
        co(function* () {
            var userTo, note;
            // notify
            var sentUsersId = []; // array for excluding duplicate sending
            var task = yield * common.getTask(req, taskId);
            for (var i in task.userIds) {
                if (sentUsersId.indexOf(task.userIds[i]) === -1) {
                    if (req.user.id !== task.userIds[i]) { // don't send self notification
                        yield self.notifyOneUser(task.userIds[i], note0, entryId, taskId, essenceName, templateName);
                        sentUsersId.push(task.userIds[i]);
                    }
                }
            }
            for (i in task.groupIds) {
                var usersFromGroup = yield * common.getUsersFromGroup(req, task.groupIds[i]);
                for (var j in usersFromGroup) {
                    if (sentUsersId.indexOf(usersFromGroup[j].userId) === -1) {
                        if (req.user.id !== usersFromGroup[j].userId) { // don't send self notification
                            yield self.notifyOneUser(usersFromGroup[j].userId, note0, entryId, taskId, essenceName, templateName);
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

    this.notifyOneUser = function (userId, note0, entryId, taskId, essenceName, templateName) { // ToDo: move to notification service when refactored
        var self = this;
        return co(function* () {
            var userTo = yield * common.getUser(req, userId);
            var note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
            notifications.notify(req, userTo, note, templateName);
        });
    };
};

module.exports = exportObject;
