var
    _ = require('underscore'),
    config = require('config'),
    common = require('app/services/common'),
    notifications = require('app/controllers/notifications'),
    crypto = require('crypto'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    csv = require('express-csv'),
    Product = require('app/models/products'),
    Project = require('app/models/projects'),
    Organization = require('app/models/organizations'),
    Workflow = require('app/models/workflows'),
    WorkflowStep = require('app/models/workflow_steps'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    SurveyAnswer = require('app/models/survey_answers'),
    User = require('app/models/users'),
    EssenceRole = require('app/models/essence_roles'),
    AccessMatrix = require('app/models/access_matrices'),
    ProductUOA = require('app/models/product_uoa'),
    Task = require('app/models/tasks'),
    UOA = require('app/models/uoas'),
    Discussion = require('app/models/discussions'),
    Index = require('app/models/indexes.js'),
    Subindex = require('app/models/subindexes.js'),
    IndexQuestionWeight = require('app/models/index_question_weights.js'),
    IndexSubindexWeight = require('app/models/index_subindex_weights.js'),
    SubindexWeight = require('app/models/subindex_weights.js'),
    co = require('co'),
    Query = require('app/util').Query,
    getTranslateQuery = require('app/util').getTranslateQuery,
    query = new Query(),
    sql = require('sql'),
    mc = require('app/mc_helper'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_products');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                )
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    tasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var curStepAlias = 'curStep';
            return yield thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
                        'WHEN '+
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
                            ' AND (' +
                            'SELECT ' +
                                '"Discussions"."id" ' +
                            'FROM "Discussions" ' +
                            'WHERE "Discussions"."taskId" = "Tasks"."id" ' +
                            'AND "Discussions"."isResolve" = true ' +
                            'AND "Discussions"."activated" = false ' +
                            'LIMIT 1' +
                            ') IS NULL ' +
                        'THEN FALSE ' +
                        'ELSE TRUE ' +
                    'END as flagged',
                    '( '+
                        'SELECT count("Discussions"."id") ' +
                        'FROM "Discussions" ' +
                        'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                        'AND "Discussions"."isReturn" = true ' +
                        //'AND "Discussions"."isResolve" = false ' +
                        'AND "Discussions"."activated" = true ' +
                    ') as flaggedCount',
                    '(' +
                        'SELECT ' +
                        '"Discussions"."taskId" ' +
                        'FROM "Discussions" ' +
                        'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                        'AND "Discussions"."isReturn" = true ' +
                        //'AND "Discussions"."isResolve" = false ' +
                        'AND "Discussions"."activated" = true ' +
                        'LIMIT 1' +
                    ') as flaggedFrom',
                    'CASE ' +
                        'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" = 0) THEN \'current\' ' +
                        'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" <> 0) THEN \'waiting\' ' +
                        'WHEN ("' + pgEscape.string(curStepAlias) + '"."position" > "WorkflowSteps"."position") OR ("ProductUOA"."isComplete" = TRUE) THEN \'completed\' ' +
                        'WHEN "' + pgEscape.string(curStepAlias) + '"."position" = "WorkflowSteps"."position" THEN \'current\' ' +
                        'WHEN "' + pgEscape.string(curStepAlias) + '"."position" < "WorkflowSteps"."position" THEN \'waiting\' ' +
                    'END as status ',
                    WorkflowStep.position,
                    '(' +
                        'SELECT max("SurveyAnswers"."created") ' +
                        'FROM "SurveyAnswers" ' +
                        'WHERE ' +
                            '"SurveyAnswers"."productId" = "Tasks"."productId" ' +
                            'AND "SurveyAnswers"."UOAid" = "Tasks"."uoaId" ' +
                            'AND "SurveyAnswers"."wfStepId" = "Tasks"."stepId" ' +
                    ') as "lastVersionDate"'
                )
                .from(
                    Task
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(UOA)
                    .on(Task.uoaId.equals(UOA.id))
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
                .where(Task.productId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    editTasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of task objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                req.body[i].productId = req.params.id;

                if (
                    typeof req.body[i].uoaId === 'undefined' ||
                    typeof req.body[i].stepId === 'undefined' ||
                    typeof req.body[i].userId === 'undefined' ||
                    typeof req.body[i].productId === 'undefined'
                ) {
                    throw new HttpError(403, 'uoaId, stepId, userId and productId fields are required');
                }

                var essenceId, userTo, task, uoa, step, survey, note, organization;
                if (req.body[i].id) { // update
                    var updateObj = _.pick(
                      req.body[i],
                      Task.editCols
                    );
                    if(Object.keys(updateObj).length){
                        var update = yield thunkQuery(Task.update(updateObj).where(Task.id.equals(req.body[i].id)));
                        updateObj.id = req.body[i].id;
                        res.updated.push(req.body[i].id);

                        // notify
                        essenceId = yield * common.getEssenceId(req, 'Tasks');
                        userTo = yield * common.getUser(req, req.body[i].userId);
                        organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
                        task = yield * common.getTask(req, parseInt(req.body[i].id));
                        product = yield * common.getEntity(req, task.productId, Product, 'id');
                        uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
                        step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
                        survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
                        note = yield * notifications.createNotification(req,
                            {
                                userFrom: req.user.realmUserId,
                                userTo: req.body[i].userId,
                                body: 'Task updated',
                                essenceId: essenceId,
                                entityId: req.body[i].id,
                                task: task,
                                product: product,
                                uoa: uoa,
                                step: step,
                                survey: survey,
                                user: userTo,
                                organization: organization,
                                date: new Date(),
                                to: {firstName : userTo.firstName, lastName: userTo.lastName},
                                config: config
                            },
                            'assignTask'
                        );

                        bologger.log({
                            req: req,
                            user: req.user,
                            action: 'update',
                            object: 'tasks',
                            entity: req.body[i].id,
                            info: 'Update task for product `'+req.params.id+'`'
                        });
                    }
                } else { // create
                    var id = yield thunkQuery(
                      Task.insert(_.pick(req.body[i], Task.table._initialConfig.columns)).returning(Task.id)
                    );
                    req.body[i].id = _.first(id).id;
                    res.inserted.push(req.body[i].id);

                    // notify
                    essenceId = yield * common.getEssenceId(req, 'Tasks');
                    userTo = yield * common.getUser(req, req.body[i].userId);
                    organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
                    task = yield * common.getTask(req, parseInt(req.body[i].id));
                    product = yield * common.getEntity(req, task.productId, Product, 'id');
                    uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
                    step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
                    survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
                    note = yield * notifications.createNotification(req,
                        {
                            userFrom: req.user.realmUserId,
                            userTo: req.body[i].userId,
                            body: 'Task created',
                            essenceId: essenceId,
                            entityId: req.body[i].id,
                            task: task,
                            product: product,
                            uoa: uoa,
                            step: step,
                            survey: survey,
                            user: userTo,
                            organization: organization,
                            date: new Date(),
                            to: {firstName : userTo.firstName, lastName: userTo.lastName},
                            config: config
                        },
                        'assignTask'
                    );

                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'tasks',
                        entity: req.body[i].id,
                        info: 'Add new task for product `'+req.params.id+'`'
                    });
                }

            }

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

  export: function (req, res, next) {
      var thunkQuery = req.thunkQuery;

      co(function* (){

          try{
              var id = yield mc.get(req.mcClient, req.params.ticket);
          }catch(e){
              throw new HttpError(500, e);
          }

          if(!id){
              throw new HttpError(400, 'Ticket is not valid');
          }

          var q =
              'SELECT ' +
              '"Tasks"."id" as "taskId", ' +
              '"UnitOfAnalysis"."name" as "uoaName", ' +
              '"UnitOfAnalysisType"."name" as "uoaTypeName", ' +
              'array(' +
                'SELECT "UnitOfAnalysisTag"."name" ' +
                'FROM "UnitOfAnalysisTagLink" ' +
                'LEFT JOIN "UnitOfAnalysisTag" ' +
                'ON ("UnitOfAnalysisTagLink"."uoaTagId" = "UnitOfAnalysisTag"."id")' +
                'WHERE "UnitOfAnalysisTagLink"."uoaId" = "UnitOfAnalysis"."id"' +
              ') as "uoaTags", ' +
              '"WorkflowSteps"."title" as "stepTitle", "WorkflowSteps"."position" as "stepPosition", ' +
              '"Users"."id" as "ownerId", concat("Users"."firstName",\' \', "Users"."lastName") as "ownerName", ' +
              //'"Roles"."name" as "ownerRole", ' +
              '"Surveys"."title" as "surveyTitle", ' +
              '"SurveyQuestions"."label" as "questionTitle", "SurveyQuestions"."qid" as "questionCode", "SurveyQuestions"."value" as "questionWeight", ' +
              '"SurveyAnswers"."value" as "answerText", "SurveyAnswers"."optionId" as "answerValue" ' +

              'FROM "Tasks" ' +
              'LEFT JOIN "Products" ON ("Tasks"."productId" = "Products"."id") ' +
              'LEFT JOIN "UnitOfAnalysis" ON ("Tasks"."uoaId" = "UnitOfAnalysis"."id") ' +
              'LEFT JOIN "UnitOfAnalysisType" ON ("UnitOfAnalysisType"."id" = "UnitOfAnalysis"."unitOfAnalysisType") ' +
              'LEFT JOIN "WorkflowSteps" ON ("Tasks"."stepId" = "WorkflowSteps"."id") ' +
              'LEFT JOIN "Users" ON ("Tasks"."userId" = "Users"."id") ' +
              //'LEFT JOIN "Roles" ON ("EssenceRoles"."roleId" = "Roles"."id") ' +
              'LEFT JOIN "Surveys" ON ("Products"."surveyId" = "Surveys"."id") ' +
              'LEFT JOIN "SurveyQuestions" ON ("Surveys"."id" = "SurveyQuestions"."surveyId") ' +

              'LEFT JOIN ( ' +
                  'SELECT ' +
                    'max("SurveyAnswers"."version") as max,' +
                    '"SurveyAnswers"."questionId",' +
                    '"SurveyAnswers"."userId",' +
                    '"SurveyAnswers"."UOAid",' +
                    '"SurveyAnswers"."wfStepId" ' +
              'FROM "SurveyAnswers" ' +
              'GROUP BY "SurveyAnswers"."questionId","SurveyAnswers"."userId","SurveyAnswers"."UOAid","SurveyAnswers"."wfStepId" ' +
              ') as "sa" ' +

              'on ((("sa"."questionId" = "SurveyQuestions"."id") ' +
              'AND ("sa"."userId" = "Users"."id")) ' +
              'AND ("sa"."UOAid" = "UnitOfAnalysis"."id")) ' +
              'AND ("sa"."wfStepId" = "WorkflowSteps"."id") ' +

              'LEFT JOIN "SurveyAnswers" ON ( ' +
                  '((("SurveyAnswers"."questionId" = "sa"."questionId") ' +
              'AND ("SurveyAnswers"."userId" = "sa"."userId")) ' +
              'AND ("SurveyAnswers"."UOAid" = "sa"."UOAid")) ' +
              'AND ("SurveyAnswers"."wfStepId" = "sa"."wfStepId") ' +
              'AND ("SurveyAnswers"."version" = "sa"."max") ' +
              ') ' +
              'WHERE ( ' +
                  pgEscape('("Tasks"."productId" = %s) ', id) +
              ')';
        debug(q);


      return yield thunkQuery(q);
    }).then(function (data) {
        if(data[0]){
            data.unshift(Object.keys(data[0]));
        }
        res.csv(data);

    },function (err) {
      next(err);
    });
  },


    getTicket: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){

            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );

            if (!product[0]) {
                throw new HttpError(404, 'Product not found');
            }

            var ticket = crypto.randomBytes(10).toString('hex');

            try{
                var r = yield mc.set(req.mcClient, ticket, product[0].id);
                return ticket;
            }catch(e){
                throw new HttpError(500, e);
            }

        }).then(function(data){
            res.status(201).json(
                {
                    ticket : data
                }
            );
        }, function(err){
            next(err);
        });
    },

    indexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getIndexes(req, productId);
        }).then(function (indexes) {
            res.json(indexes);
        }, function (err) {
            next(err);
        });
    },

    editIndexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of index objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                if (
                    typeof req.body[i].title === 'undefined' ||
                    typeof req.body[i].divisor === 'undefined' ||
                    typeof req.body[i].questionWeights === 'undefined' ||
                    typeof req.body[i].subindexWeights === 'undefined'
                ) {
                    throw new HttpError(403, 'title, divisor, questionWeights and subindexWeights fields are required');
                }

                var indexObj = _.pick(req.body[i], ['title', 'divisor']);
                var indexId;

                if (req.body[i].id) { // update
                    // update Index
                    yield thunkQuery(Index.update(indexObj).where(Index.id.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'indexes',
                        entity: req.body[i].id,
                        info: 'Update index for product `'+req.params.id+'`'
                    });

                    // drop all existing weights
                    yield thunkQuery(IndexQuestionWeight.delete().where(IndexQuestionWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'IndexQuestionWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: req.body[i].id
                        },
                        quantity: 1,
                        info: 'Drop all existing question weights for index `'+req.body[i].id+'` for product `'+req.params.id+'`'
                    });
                    yield thunkQuery(IndexSubindexWeight.delete().where(IndexSubindexWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'IndexSubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: req.body[i].id
                        },
                        quantity: 1,
                        info: 'Drop all existing subindex weights for index `'+req.body[i].id+'` for product `'+req.params.id+'`'
                    });

                    indexId = req.body[i].id;
                    res.updated.push(indexId);
                } else { // create
                    indexObj.productId = req.params.id;
                    var id = yield thunkQuery(Index.insert(indexObj).returning(Index.id), {
                        'realm': req.param('realm')
                    });

                    indexId = _.first(id).id;
                    res.inserted.push(indexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'Indexes',
                        entity: indexId,
                        info: 'Add new index for product `'+req.params.id+'`'
                    });
                }

                // insert weights
                for (var questionId in req.body[i].questionWeights) {
                    var weightObj = {
                        indexId: indexId,
                        questionId: questionId,
                        weight: req.body[i].questionWeights[questionId].weight,
                        type: req.body[i].questionWeights[questionId].type,
                        aggregateType: req.body[i].questionWeights[questionId].aggregateType
                    };
                    yield thunkQuery(IndexQuestionWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'IndexQuestionWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: indexId,
                            questionId: questionId
                        },
                        quantity: 1,
                        info: 'Add new question weight for index `'+indexId+'` for question `'+questionId+'` for product `'+req.params.id+'`'
                    });
                }
                for (var subindexId in req.body[i].subindexWeights) {
                    var weightObj = {
                        indexId: indexId,
                        subindexId: subindexId,
                        weight: req.body[i].subindexWeights[subindexId].weight,
                        type: req.body[i].subindexWeights[subindexId].type
                    };
                    yield thunkQuery(IndexSubindexWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'IndexSubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: indexId,
                            subindexId: subindexId
                        },
                        quantity: 1,
                        info: 'Add new subindex weight for index `'+indexId+'` for subindex `'+subindexId+'` for product `'+req.params.id+'`'
                    });
                }
            }

            // remove all old indexes
            yield thunkQuery(
                Index
                    .delete()
                    .where(
                        Index.productId.equals(req.params.id)
                        .and(Index.id.notIn(res.inserted.concat(res.updated)))
                    )
            );

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },


    subindexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getSubindexes(req, productId);
        }).then(function (subindexes) {
            res.json(subindexes);
        }, function (err) {
            next(err);
        });
    },

    editSubindexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of subindex objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                if (
                    typeof req.body[i].title === 'undefined' ||
                    typeof req.body[i].divisor === 'undefined' ||
                    typeof req.body[i].weights === 'undefined'
                ) {
                    throw new HttpError(403, 'title, divisor, weights fields are required');
                }

                var subindexObj = _.pick(req.body[i], ['title', 'divisor']);
                var subindexId;

                if (req.body[i].id) { // update
                    // update Subindex
                    yield thunkQuery(Subindex.update(subindexObj).where(Subindex.id.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'Subindexes',
                        entity: req.body[i].id,
                        info: 'Update subindex for product `'+req.params.id+'`'
                    });

                    // drop all existing weights
                    yield thunkQuery(SubindexWeight.delete().where(SubindexWeight.subindexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });

                    subindexId = req.body[i].id;
                    res.updated.push(subindexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'SubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            subindexId: subindexId
                        },
                        quantity: 1,
                        info: 'Drop all existing weights for subindex `'+subindexId+'` for product `'+req.params.id+'`'
                    });
                } else { // create
                    subindexObj.productId = req.params.id;
                    var id = yield thunkQuery(Subindex.insert(subindexObj).returning(Subindex.id), {
                        'realm': req.param('realm')
                    });

                    subindexId = _.first(id).id;
                    res.inserted.push(subindexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'Subindexes',
                        entity: subindexId,
                        entities: null,
                        info: 'Add new subindex for product `'+req.params.id+'`'
                    });
                }

                // insert weights
                for (var questionId in req.body[i].weights) {
                    var weightObj = {
                        subindexId: subindexId,
                        questionId: questionId,
                        weight: req.body[i].weights[questionId].weight,
                        type: req.body[i].weights[questionId].type,
                        aggregateType: req.body[i].weights[questionId].aggregateType
                    };
                    yield thunkQuery(SubindexWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'SubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            subindexId: subindexId,
                            questionId: questionId
                        },
                        quantity: 1,
                        info: 'Add new weight for subindex `'+subindexId+'` for question `'+questionId+'` for product `'+req.params.id+'`'
                    });
                }
            }

            // remove all old indexes
            yield thunkQuery(
                Subindex
                    .delete()
                    .where(
                        Subindex.productId.equals(req.params.id)
                        .and(Subindex.id.notIn(res.inserted.concat(res.updated)))
                    )
            );

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    aggregateIndexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(req, productId, false);
        }).then(function (result) {
            res.json(result);
        }, function (err) {
            next(err);
        });
    },

    aggregateIndexesCsv: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(req, productId, false);
        }).then(function (result) {
            // column titles
            var titles = {
                questions: {},
                indexes: {},
                subindexes: {}
            };
            ['questions', 'indexes', 'subindexes'].forEach(function (collection) {
                result[collection].forEach(function (datum) {
                    titles[collection][datum.id] = datum.title;
                });
            });

            var output = result.agg.map(function (uoa) {
                var uoaOutput = _.pick(uoa, ['id', 'name', 'ISO2']);
                ['questions', 'indexes', 'subindexes'].forEach(function (collection) {
                    for (var datumId in uoa[collection]) {
                        uoaOutput[titles[collection][datumId]] = uoa[collection][datumId];
                    }
                });
                return uoaOutput;
            });

            // add header row
            // aggregateIndexes ensures uniform keys across uoas
            var headerRow = {};
            for (var key in output[0]) {
                headerRow[key] = key;
            }
            output.unshift(headerRow);

            res.csv(output);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* (){
            var product =  yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                )
                .where(Product.id.equals(req.params.id))
            );

            if(!_.first(product)){
                throw new HttpError(403, 'Not found');
            }

            return _.first(product);
        }).then(function(data){
            res.json(data);
        },function(err){
            next(err);
        })
    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                Product.delete().where(Product.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'products',
                entity: req.params.id,
                info: 'Delete product'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield * checkProductData(req);
            if (parseInt(req.body.status) === 1) { // if status changed to 'STARTED'
                var result = yield * updateCurrentStepId(req);
                if (typeof result === 'object') {
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'ProductUOA',
                        entities: result,
                        quantity: 1,
                        info: 'Update currentStep to `'+result.currentStepId+'` for product `'+result.productId+'` (for all subjects)'
                    });
                } else {
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'ProductUOA',
                        entities: null,
                        info: 'Error update currentStep for product `'+req.params.id+'` (Not found step ID or min step position)'
                    });
                }
            }
            return yield thunkQuery(Product.update(_.pick(req.body, Product.editCols)).where(Product.id.equals(req.params.id)));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'products',
                entity: req.params.id,
                info: 'Update product'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield * checkProductData(req);
            var result = yield thunkQuery(
                Product.insert(_.pick(req.body, Product.table._initialConfig.columns)).returning(Product.id)
            );
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'products',
                entity: _.first(data).id,
                info: 'Add new product'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    UOAselect: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                ProductUOA.select(UOA.star(), ProductUOA.currentStepId)
                .from(
                    ProductUOA
                    .leftJoin(UOA)
                    .on(ProductUOA.UOAid.equals(UOA.id))
                )
                .where(ProductUOA.productId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    UOAadd: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            yield thunkQuery(
                ProductUOA.insert({
                    productId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: req.params.id,
                    uoaId: uoaId
                },
                quantity: 1,
                info: 'Add new subject `'+uoaId+'` for product `'+req.params.id+'`'
            });

            res.status(201).end();
        }, function(err){
            next(err);
        });
    },

    UOAaddMultiple: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of unit ids in request body');
            }

            var product = yield thunkQuery(Product.select().where(Product.id.equals(req.params.id)));
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }

            var result = yield thunkQuery(ProductUOA.select(ProductUOA.UOAid).from(ProductUOA).where(ProductUOA.productId.equals(req.params.id)));
            var existIds = result.map(function (value, key) {
                return value.UOAid;
            });
            result = yield thunkQuery(UOA.select(UOA.id).from(UOA).where(UOA.id.in(req.body)));
            var ids = result.map(function (value, key) {
                return value.id;
            });
            var insertArr = [];
            for (var i in req.body) {
                if (ids.indexOf(req.body[i]) === -1) {
                    throw new HttpError(403, 'Unit of Analisys with id = ' + req.body[i] + ' does not exist');
                }
                if (existIds.indexOf(req.body[i]) > -1) {
                    throw new HttpError(403, 'Relation for Unit of Analisys with id = ' + req.body[i] + ' has already existed');
                }
                insertArr.push({
                    productId: req.params.id,
                    UOAid: req.body[i]
                });
            }

            return yield thunkQuery(ProductUOA.insert(insertArr).returning('*'));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'ProductUOA',
                entity: null,
                entities: data,
                quantity: data.length,
                info: 'Add new subjects (uoas) for product `'+req.params.id+'`'
            });
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    UOAdelete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                ProductUOA.delete().where({
                    productId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function(){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: req.params.id,
                    uoaId: req.params.uoaid
                },
                quantity: 1,
                info: 'Delete subject `'+req.params.uoaid+'` for product `'+req.params.id+'`'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });

    },

    productUOAmove: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            return yield * moveWorkflow(req, req.params.id, req.params.uoaid);
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    }

};

function* checkProductData(req) {
    var thunkQuery = req.thunkQuery;
    if (!req.params.id) { // create
        if (!req.body.projectId) {
            throw new HttpError(403, 'Matrix id and Project id fields are required');
        }
    }

    if (typeof req.body.status != 'undefined') {
        if (Product.statuses.indexOf(req.body.status) == -1) {
            throw new HttpError(
                403,
                'Status can be only: ' +
                '0 - Planning, ' +
                '1 - Started, ' +
                '2 - Suspended, ' +
                '3 - Completed, ' +
                '4 - Canceled'
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

}

function* updateCurrentStepId(req) {
    var thunkQuery = req.thunkQuery;

    var essenceId = yield * common.getEssenceId(req, 'Tasks');
    var product   = yield * common.getEntity(req, req.params.id, Product, 'id');
    var survey    = yield * common.getEntity(req, product.surveyId, Survey, 'id');

    console.log(product.status);

    // start-restart project -> set isComplete flag to false for all subjects
    if (product.status != 2) { // not suspended
        yield thunkQuery(
            ProductUOA.update({isComplete: false}).where(ProductUOA.productId.equals(req.params.id))
        );
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
        debug('Not found min step position for productId `'+req.params.id+'`');
        return null;
    }
    var minStepPositions = result;


        // get step ID with min step position for specified productId and each uoaId
        for (var i = 0; i < minStepPositions.length; i++) {
            var nextStep = yield thunkQuery(
                WorkflowStep
                    .select(
                        WorkflowStep.id,
                        Task.userId,
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
                minStepPositions[i].userId = nextStep[0].userId;
                minStepPositions[i].taskId = nextStep[0].taskId;

                // update all currentStepId with min position step ID for specified productId for each subject
                //
                if (product.status != 2) { // not suspended
                    result = yield thunkQuery(ProductUOA
                        .update({currentStepId: minStepPositions[i].stepId})
                        .where(ProductUOA.productId.equals(req.params.id)
                            .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                        )
                    );
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
                            .update({currentStepId: minStepPositions[i].stepId})
                            .where(ProductUOA.productId.equals(req.params.id)
                                .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                            )
                        );
                    }
                }

                // notify
                //essenceId = yield * common.getEssenceId(req, 'Tasks');
                var userTo = yield * common.getUser(req, minStepPositions[i].userId);
                var organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
                var task = yield * common.getTask(req, parseInt(minStepPositions[i].taskId));
                //product = yield * common.getEntity(req, task.productId, Product, 'id');
                var uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
                var step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
                //survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
                var note = yield * notifications.createNotification(req,
                    {
                        userFrom: req.user.realmUserId,
                        userTo: minStepPositions[i].userId,
                        body: 'Task activated (project started)',
                        essenceId: essenceId,
                        entityId: task.id,
                        task: task,
                        product: product,
                        uoa: uoa,
                        step: step,
                        survey: survey,
                        user: userTo,
                        organization: organization,
                        date: new Date(),
                        to: {firstName : userTo.firstName, lastName: userTo.lastName},
                        config: config
                    },
                    'activateTask'
                );

            }
        }



    return {
        productId: req.params.id,
        currentSteps: minStepPositions
    };

}

function* dumpProduct(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
          'SELECT ' +
          '  "SurveyAnswers"."UOAid" AS "id", ' +
          '  "UnitOfAnalysis"."name", ' +
          '  "UnitOfAnalysis"."ISO2", ' +
          "  format('{%s}', " +
          "    string_agg(format('\"%s\":%s', " +
          '      "SurveyQuestions".id, ' +
          // use optionId for multichoice questions, value otherwise
          '      CASE ' +
          '        WHEN ("SurveyQuestions"."type"=2 OR "SurveyQuestions"."type"=3 OR "SurveyQuestions"."type"=4) ' +
          '          THEN format(\'[%s]\', array_to_string("SurveyAnswers"."optionId", \',\')) ' +
          '        ELSE format(\'"%s"\', "SurveyAnswers"."value") ' +
          '      END ' +
          "    ), ',') " +
          '  ) AS "questions" ' +
          'FROM ' +
          '  "SurveyQuestions" ' +
          'LEFT JOIN ' +
          '  "Products" ON ("Products"."surveyId" = "SurveyQuestions"."surveyId") ' +
          'LEFT JOIN ( ' +
          '  SELECT ' +
          '    "SurveyAnswers"."questionId", ' +
          '    "SurveyAnswers"."UOAid", ' +
          '    max("SurveyAnswers"."wfStepId") as "maxWfStepId" ' +
          '  FROM ' +
          '    "SurveyAnswers" ' +
          '  WHERE ' +
          pgEscape('    ("SurveyAnswers"."productId" = %s)', productId) +
          '  GROUP BY ' +
          '    "SurveyAnswers"."questionId", ' +
          '    "SurveyAnswers"."UOAid" ' +
          ') as "sqWf" ON ("sqWf"."questionId" = "SurveyQuestions"."id") ' +
          'LEFT JOIN ( ' +
          '  SELECT ' +
          '    "SurveyAnswers"."questionId", ' +
          '    "SurveyAnswers"."UOAid", ' +
          '    "SurveyAnswers"."wfStepId", ' +
          '    max("SurveyAnswers"."version") as "maxVersion" ' +
          '  FROM ' +
          '    "SurveyAnswers" ' +
          '  WHERE ' +
          pgEscape('    ("SurveyAnswers"."productId" = %s)', productId) +
          '  GROUP BY ' +
          '    "SurveyAnswers"."questionId", ' +
          '    "SurveyAnswers"."UOAid", ' +
          '    "SurveyAnswers"."wfStepId" ' +
          ') as "sqMax" ON ( ' +
          '  ("sqMax"."questionId" = "SurveyQuestions"."id") ' +
          '  AND ("sqMax"."UOAid" = "sqWf"."UOAid") ' +
          '  AND ("sqMax"."wfStepId" = "sqWf"."maxWfStepId") ' +
          ') ' +
          'INNER JOIN "SurveyAnswers" ON ( ' +
          '  ("SurveyAnswers"."questionId" = "SurveyQuestions".id) ' +
          '  AND ("SurveyAnswers"."UOAid" = "sqWf"."UOAid") ' +
          '  AND ("SurveyAnswers"."wfStepId" = "sqWf"."maxWfStepId") ' +
          '  AND ("SurveyAnswers"."version" = "sqMax"."maxVersion") ' +
          pgEscape('  AND ("SurveyAnswers"."productId" = %s)', productId) +
          ') ' +
          'LEFT JOIN ' +
          '  "UnitOfAnalysis" ON ("UnitOfAnalysis"."id" = "SurveyAnswers"."UOAid") ' +
          'WHERE ' +
          pgEscape('  ("Products"."id" = %s)', productId) +
          'GROUP BY ' +
          '  "SurveyAnswers"."UOAid", ' +
          '  "UnitOfAnalysis"."ISO2", ' +
          '  "UnitOfAnalysis"."name" ' +
          '; ';

  var data = yield thunkQuery(q);
  data = data.map(function (uoa) {
      uoa.questions = JSON.parse(uoa.questions);
      return uoa;
  });
  return data;
}

function parseWeights(weightsString) {
    // parse JSON weights string into js object
    // due to postgres quirks, {} represented as '{:}'
    try {
        return JSON.parse(weightsString);
    } catch (e) {
        return {};
    }
}

function* getSubindexes(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
          'SELECT ' +
          '  "Subindexes"."id", ' +
          '  "Subindexes"."title", ' +
          '  "Subindexes"."divisor"::float, ' +
          "  format('{%s}', " +
          "    string_agg(format('\"%s\":{\"weight\": %s, \"type\": \"%s\", \"aggregateType\": %s}', " +
          '      "SubindexWeights"."questionId", ' +
          '      "SubindexWeights"."weight", ' +
          '      "SubindexWeights"."type", ' +
          '      CASE ' +
          '        WHEN "SubindexWeights"."aggregateType" is null THEN \'null\' ' +
          '        ELSE format(\'"%s"\', "SubindexWeights"."aggregateType") ' +
          '      END ' +
          "    ), ',') " +
          '  ) AS "weights" ' +
          'FROM ' +
          '  "Subindexes" ' +
          'LEFT JOIN ' +
          '  "SubindexWeights" ON "SubindexWeights"."subindexId" = "Subindexes"."id" ' +
          'WHERE ' +
          pgEscape('  ("Subindexes"."productId" = %s) ', productId) +
          'GROUP BY ' +
          '  "Subindexes"."id", ' +
          '  "Subindexes"."title", ' +
          '  "Subindexes"."divisor" ' +
          '; ';
    var subindexes = yield thunkQuery(q);
    return subindexes.map(function (subindex) {
      subindex.weights = parseWeights(subindex.weights);
      return subindex;
    });
}

function* getIndexes(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
        'SELECT ' +
        '  "Indexes"."id", ' +
        '  "Indexes"."title", ' +
        '  "Indexes"."divisor"::float, ' +
        "  format('{%s}', " +
        "    string_agg(format('\"%s\":{\"weight\": %s, \"type\": \"%s\", \"aggregateType\": %s}', " +
        '      "IndexQuestionWeights"."questionId", ' +
        '      "IndexQuestionWeights"."weight", ' +
        '      "IndexQuestionWeights"."type", ' +
        '      CASE ' +
        '        WHEN "IndexQuestionWeights"."aggregateType" is null THEN \'null\' ' +
        '        ELSE format(\'"%s"\', "IndexQuestionWeights"."aggregateType") ' +
        '      END ' +
        "    ), ',') " +
        '  ) AS "questionWeights", ' +
        "  format('{%s}', " +
        "    string_agg(format('\"%s\":{\"weight\": %s, \"type\": \"%s\"}', " +
        '      "IndexSubindexWeights"."subindexId"::text, ' +
        '      "IndexSubindexWeights"."weight", ' +
        '      "IndexSubindexWeights"."type" ' +
        "    ), ',') " +
        '  ) AS "subindexWeights" ' +
        'FROM ' +
        '  "Indexes" ' +
        'LEFT JOIN ' +
        '  "IndexQuestionWeights" ON "IndexQuestionWeights"."indexId" = "Indexes"."id" ' +
        'LEFT JOIN ' +
        '  "IndexSubindexWeights" ON "IndexSubindexWeights"."indexId" = "Indexes"."id" ' +
        'WHERE ' +
        '  ("Indexes"."productId" = ' + productId + ') ' +
        'GROUP BY ' +
        '  "Indexes"."id", ' +
        '  "Indexes"."title", ' +
        '  "Indexes"."divisor" ' +
        '; ';
    var indexes = yield thunkQuery(q);
    return indexes.map(function (index) {
        index.questionWeights = parseWeights(index.questionWeights);
        index.subindexWeights = parseWeights(index.subindexWeights);
        return index;
    });
}

function* parseAnswer(req, answer, questionType) {
    var thunkQuery = req.thunkQuery;

    if (questionType === 5 || questionType === 7) { // numerical or currency
        return parseFloat(answer);
    } else if (questionType === 3 || questionType === 4) { // single selection
        var selected = (yield thunkQuery(
            SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(answer))
        ))[0];
        return selected.value;
    } else if (questionType === 2) { // multiple selection
        // selected options
        var selected = [];
        for (var j = 0; j < answer.length; j++) {
            selected.push((yield thunkQuery(
                SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(answer[j]))
            ))[0]);
        }
        return selected.map(function (selection) {
            return selection.value;
        });
    } else {
        return answer;
    }
}

function* parseNumericalAnswer(raw, questionType) {
    var parsed;
    if (questionType === 5 || questionType === 7) { // numerical or currency
        parsed = raw;
    } else if (questionType === 3 || questionType === 4) { // single selection
        parsed = parseFloat(raw);
    } else if (questionType === 2) { // multiple selection
        // selected options
        parsed = raw.map(parseFloat);
    } else {
        debug("Non-numerical question of type %d", questionType);
        parsed = parseFloat(raw);
    }
    return parsed;
}
function sum(arr) {
    return arr.reduce(function (s, v) { return s + v; });
}

function avg(arr) {
    return sum(arr)/arr.length;
}

function filterData(data, questions, indexes, subindexes, allQuestions) {
    // only return questions for which at least one UOA has an answer
    var questionsPresent = new Set();

    // only parse questions required by at least one (sub)index
    var questionsRequired = new Set();
    subindexes.forEach(function (subindex) {
        for (var questionId in subindex.weights) {
            questionsRequired.add(questionId);
        }
    });
    indexes.forEach(function (index) {
        for (var questionId in index.questionWeights) {
            questionsRequired.add(questionId);
        }
    });

    // filter data
    for (var i = 0; i < data.length; i++) {
        for (var questionId in data[i].questions) {
            if (questionsRequired.has(questionId)) {
                questionsPresent.add(questionId);
            } else if (!allQuestions) {
                delete data[i].questions[questionId];
            }
        }
    }

    // filter questions
    questions = questions.filter(function (question) {
        return questionsPresent.has(question.id.toString());
    });

    return { questions: questions, questionsRequired: questionsRequired };
}

function* parseAnswers(req, data, questions, questionsRequired) {
    // type of each question
    var questionTypes = {};
    questions.forEach(function (question) {
        questionTypes[question.id] = question.type;
    });

    for (var i = 0; i < data.length; i++) {
        for (var questionId in data[i].questions) {
            // turn option id into options
            data[i].questions[questionId] = yield parseAnswer(
                req,
                data[i].questions[questionId],
                questionTypes[questionId]
            );

            // only questions which we're using in aggregation
            if (questionsRequired.has(questionId)) {
                data[i].questions[questionId] = yield parseNumericalAnswer(
                    data[i].questions[questionId],
                    questionTypes[questionId]
                );
            }
        }
    }

    return data;
}

function* getQuestions(req, productId) {
    var thunkQuery = req.thunkQuery;
    q =
        'SELECT ' +
        '  "SurveyQuestions"."id", ' +
        '  "SurveyQuestions"."label" AS "title", ' +
        '  "SurveyQuestions"."type" ' +
        'FROM ' +
        '  "SurveyQuestions" ' +
        'LEFT JOIN ' +
        '  "Products" ON "Products"."surveyId" = "SurveyQuestions"."surveyId" ' +
        'WHERE ' +
        '  ("Products"."id" = ' + productId + ') ' +
        '; ';
    return yield thunkQuery(q);
}

function calcMinsMaxes(data) {
    var mins = {};
    var maxes = {};

    data.forEach(function (datum) {
        for (var id in datum) {
            if (datum && datum[id].constructor === Array) { // array of values
                var valSum = sum(datum[id]);
                var valAvg = avg(datum[id]);
                if (!(id in mins)) {
                    mins[id] = { sum: valSum, average: valAvg };
                } else {
                    if (valSum < mins[id].sum) { mins[id].sum = valSum; }
                    if (valAvg < mins[id].average) { mins[id].average = valAvg; }
                }
                if (!(id in maxes)) {
                    maxes[id] = { sum: valSum, average: valAvg };
                } else {
                    if (valSum > maxes[id].sum) { maxes[id].sum = valSum; }
                    if (valAvg > maxes[id].average) { maxes[id].average = valAvg; }
                }
            } else if (datum) { // single value
                var val = datum[id];
                if (!(id in mins) || val < mins[id]) { mins[id] = val; }
                if (!(id in maxes) || val > maxes[id]) { maxes[id] = val; }
            }
        }
    });

    return { mins: mins, maxes: maxes };
}

function calcTerm(weights, vals, minsMaxes) {
    var value = 0;
    for (var id in weights) {
        var weight = weights[id];
        var val = vals[id];

        if (val && val.constructor === Array) {
            if (weight.aggregateType === "average") { // average
                val = avg(val);
            } else { // sum
                weight.aggregateType = 'sum';
                val = sum(val);
            }
        }

        if (weight.type === 'value') { // raw value
            value += weight.weight * val;
        } else if (weight.type === 'percentile') { // percentile rank
            var min = minsMaxes.mins[id];
            var max = minsMaxes.maxes[id];
            if (typeof min === 'object') { // typeof max = 'object'
                min = min[weight.aggregateType];
                max = max[weight.aggregateType];
            }
            value += weight.weight * (val - min) / (max - min);
        }
    }
    return value;
}

function* aggregateIndexes(req, productId, allQuestions) {
    // get data
    var data = yield dumpProduct(req, productId);
    var subindexes = yield getSubindexes(req, productId);
    var indexes = yield getIndexes(req, productId);
    var questions = yield getQuestions(req, productId);

    // initial preprocessing
    var filtered = filterData(data, questions, indexes, subindexes, allQuestions);
    if (!allQuestions) {
        questions = filtered.questions;
    }
    data = yield parseAnswers(req, data, questions, filtered.questionsRequired);

    // precalculate min/max of questions for subindex percentile calculations
    // qMinsMaxes = calcMinsMaxes(_.pluck(data, 'questions'));
    qMinsMaxes = calcMinsMaxes(data.map(function (datum) {
        var qs = {};
        for (var qid in datum.questions) {
            if (filtered.questionsRequired.has(qid)) {
                qs[qid] = datum.questions[qid];
            }
        }
        return qs;
    }));

    // calculate subindexes
    for (var i = 0; i < data.length; i++) {
        data[i].subindexes = {};
        subindexes.forEach(function (si) {
            data[i].subindexes[si.id] = calcTerm(si.weights, data[i].questions, qMinsMaxes) / si.divisor;
        });
    }

    // precalculate min/max of subindexes for index percentile calculations
    var siMinsMaxes = calcMinsMaxes(_.pluck(data, 'subindexes'));

    // calculate indexes
    var result = { agg: [] };
    for (var i = 0; i < data.length; i++) {
        data[i].indexes = {};
        indexes.forEach(function (index) {
            data[i].indexes[index.id] = (
                    calcTerm(index.questionWeights, data[i].questions, qMinsMaxes) +
                    calcTerm(index.subindexWeights, data[i].subindexes, siMinsMaxes)
                ) / index.divisor;
        });
        result.agg.push(data[i]);
    }

    // add all (non)calculated fields
    result.subindexes = subindexes.map(function (subindex) {
        return { id: subindex.id, title: subindex.title };
    });
    result.indexes = indexes.map(function (index) {
        return { id: index.id, title: index.title };
    });
    result.questions = questions;

    return result;
}
module.exports.calcAggregateIndexes = aggregateIndexes;

var moveWorkflow = function* (req, productId, UOAid) {
    var essenceId,task, userTo, organization, product, uoa, step, survey, note;
    var thunkQuery = req.thunkQuery;
    //if (req.user.roleID !== 2 && req.user.roleID !== 1) { // TODO check org owner
    //    throw new HttpError(403, 'Access denied');
    //}
    var curStep = yield * common.getCurrentStepExt(req, productId, UOAid);
    if (req.query.resolve) { // try to resolve
        // check if resolve is possible
        var resolvePossible = yield * isResolvePossible(req, productId, UOAid);
        if (!resolvePossible) {
            throw new HttpError(403, 'Resolve is not possible. Not all flags are resolved.');
        }
        // DO resolve
        var step4Resolve = yield * getStep4Resolve(req, curStep.task.id);
        if (!step4Resolve){
            throw new HttpError(403, 'Resolve is not possible. Not found step for resolve');
        }
        // activate discussion`s entry with resolve flag
        yield * activateEntries(req, curStep.task.id, {isResolve: true});

        // set currentStep to step4Resolve
        yield * updateCurrentStep(req, step4Resolve, productId, UOAid);

        // notify:  The person who assigned the flag now receives a notification telling him that the flags were resolved and are ready to be reviewed.
        //essenceId = yield * common.getEssenceId(req, 'Tasks');
        task = yield * common.getTaskByStep(req, step4Resolve);
        userTo = yield * common.getUser(req, task.userId);
        organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
        product = yield * common.getEntity(req, task.productId, Product, 'id');
        uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
        step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
        survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
        note = yield * notifications.createNotification(req,
            {
                userFrom: req.user.realmUserId,
                userTo: task.userId,
                body: 'flags were resolved',
                //essenceId: essenceId,
                //entityId: nextStep.taskId,
                task: task,
                product: product,
                uoa: uoa,
                step: step,
                survey: survey,
                user: userTo,
                organization: organization,
                date: new Date(),
                to: {firstName : userTo.firstName, lastName: userTo.lastName},
                config: config
            },
            'resolveFlag'
        );
        return;

    }
    if (req.query.force) { // force to move step
        // delete discussion`s entry with return flag
        //yield * deleteEntries(req, curStep.task.id, {isReturn: true});
    }

    // check if exist return flag(s)
    var returnStepId = yield * common.getReturnStep(req, productId, UOAid);
    if (returnStepId && !req.query.force && !req.query.resolve) { // exist discussion`s entries with return flags and not activated (only for !force and !resolve)
        // set currentStep to step from returnTaskId
        yield * updateCurrentStep(req, returnStepId, productId, UOAid);
        // activate discussion`s entry with return flag
        var flagsCount = yield * activateEntries(req, curStep.task.id, {isReturn: true});

        // notify:  notification that they have [X] flags requiring resolution in the [Subject] survey for the [Project]
        //essenceId = yield * common.getEssenceId(req, 'Tasks');
        task = yield * common.getTaskByStep(req, returnStepId);
        userTo = yield * common.getUser(req, task.userId);
        organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
        product = yield * common.getEntity(req, task.productId, Product, 'id');
        uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
        step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
        survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
        note = yield * notifications.createNotification(req,
            {
                userFrom: req.user.realmUserId,
                userTo: task.userId,
                body: 'flags requiring resolution',
                //essenceId: essenceId,
                //entityId: nextStep.taskId,
                task: task,
                product: product,
                uoa: uoa,
                step: step,
                survey: survey,
                user: userTo,
                organization: organization,
                date: new Date(),
                flags: {count: flagsCount},
                to: {firstName : userTo.firstName, lastName: userTo.lastName},
                config: config
            },
            'returnFlag'
        );
        return;
    }
    var minNextStepPosition = yield * common.getMinNextStepPosition(req, curStep, productId, UOAid);
    var nextStep = null;
    if(minNextStepPosition !== null) { // min next step exists, position is not null
        nextStep = yield * common.getNextStep(req, minNextStepPosition, productId, UOAid);
    }

    if(nextStep) { // next step exists, set it to current
        // set currentStep to step from returnTaskId
        yield * updateCurrentStep(req, nextStep.id, curStep.task.productId, curStep.task.uoaId);

        // notify
        essenceId = yield * common.getEssenceId(req, 'Tasks');
        task = yield * common.getTask(req, parseInt(nextStep.taskId));
        userTo = yield * common.getUser(req, task.userId);
        organization = yield * common.getEntity(req, userTo.organizationId, Organization, 'id');
        product = yield * common.getEntity(req, task.productId, Product, 'id');
        uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
        step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
        survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
        note = yield * notifications.createNotification(req,
            {
                userFrom: req.user.realmUserId,
                userTo: task.userId,
                body: 'Task activated (next step)',
                essenceId: essenceId,
                entityId: nextStep.taskId,
                task: task,
                product: product,
                uoa: uoa,
                step: step,
                survey: survey,
                user: userTo,
                organization: organization,
                date: new Date(),
                to: {firstName : userTo.firstName, lastName: userTo.lastName},
                config: config
            },
            'activateTask'
        );

    }else{
        // next step does not exists - set productUOA status to complete
        yield thunkQuery(
            ProductUOA
                .update({isComplete: true})
                .where({productId: curStep.task.productId, UOAid: curStep.task.uoaId})
        );
        bologger.log({
            req: req,
            user: req.user,
            action: 'update',
            object: 'ProductUOA',
            entities: {
                productId: curStep.task.productId,
                uoaId: curStep.task.uoaId,
                isComplete: true
            },
            quantity: 1,
            info: 'Set productUOA status to complete for subject `'+curStep.task.uoaId+'` for product `'+curStep.task.productId+'`'
        });
        var uncompleted = yield thunkQuery( // check for uncompleted
            ProductUOA
                .select()
                .where(
                {
                    productId: curStep.task.productId,
                    isComplete: false
                }
            )
        );
        if (!uncompleted.length) { // set product status to complete
            yield thunkQuery(
                Product.update({status: 3}).where(Product.id.equals(curStep.task.productId))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'Product',
                entity: curStep.task.productId,
                info: 'Set product status to complete'
            });
        }
    }
    debug(nextStep);

};
exports.moveWorkflow = moveWorkflow;

function* updateCurrentStep(req, currentStepId, productId, uoaId) {
    var thunkQuery = req.thunkQuery;
    // set currentStep
    yield thunkQuery(
        ProductUOA
            .update({currentStepId: currentStepId})
            .where({productId: productId, UOAid: uoaId})
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'update',
        object: 'ProductUOA',
        entities: {
            productId: productId,
            uoaId: uoaId,
            currentStepId: currentStepId
        },
        quantity: 1,
        info: 'Update currentStep to `'+currentStepId+'` for subject `'+uoaId+'` for product `'+productId+'` (return flag)'
    });
}

function* activateEntries(req, taskId, flag) {
    var thunkQuery = req.thunkQuery;

    // activate discussion`s entry with return (reslove) flag
    var whereCond = _.extend({taskId: taskId, activated: false}, flag);
    var result = yield thunkQuery(
        Discussion
            .update({activated: true})
            .where(whereCond)
            .returning(Discussion.id, Discussion.taskId)
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'update',
        object: 'Discussions',
        entities: result,
        quantity: (result) ? result.length: 0,
        info: 'Activate return(resolve) entries for task `'+taskId+'`'
    });

    return (result) ? result.length: 0;
}

function* deleteEntries(req, taskId, flag) {
    var thunkQuery = req.thunkQuery;

    // delete discussion`s entry with return (reslove) flag ??? (maybe update flag to false)
    var whereCond = _.extend({taskId: taskId, activated: false}, flag);
    var result = yield thunkQuery(
        Discussion
            .delete()
            .where(whereCond)
            .returning(Discussion.id, Discussion.taskId)
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'delete',
        object: 'Discussions',
        entities: result,
        quantity: (result) ? result.length: 0,
        info: 'Delete return(resolve) entries for task `'+taskId+'`'
    });

    return (result) ? result.length: 0;
}

function* isResolvePossible(req, productId, uoaId) {
    /*
     Check possibility to Resolve
     If exist ACTIVATED record in table Discussions for current surveys (unique Product-UoA) which have isReturn=true and isResolve=false - resolve does not possible
     */
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion
            .select(Discussion.questionId)
            .from(Discussion
                .join(Task)
                .on(Task.id.equals(Discussion.taskId))
            )
            .where(
            Discussion.isReturn.equals(true)
                .and(Discussion.activated.equals(true))
                .and(Discussion.isResolve.equals(false))
                .and(Task.productId.equals(productId))
                .and(Task.uoaId.equals(uoaId))
            )
    );
    return (!_.first(result));
}

function* getStep4Resolve(req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion
            .select(Task.stepId)
            .from(Discussion
                .join(Task)
                .on(Task.id.equals(Discussion.taskId))
        )
            .where(
            Discussion.isResolve.equals(true)
                .and(Discussion.isReturn.equals(true))
                .and(Discussion.activated.equals(true))
                .and(Discussion.returnTaskId.equals(taskId))
        )
    );
    return (result[0]) ? result[0].stepId : null;
}
