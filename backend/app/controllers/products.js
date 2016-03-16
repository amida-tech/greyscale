var
    _ = require('underscore'),
    config = require('config'),
    csv = require('express-csv'),
    Product = require('app/models/products'),
    Project = require('app/models/projects'),
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
    Index = require('app/models/indexes.js'),
    Subindex = require('app/models/subindexes.js'),
    IndexQuestionWeight = require('app/models/index_question_weights.js'),
    IndexSubindexWeight = require('app/models/index_subindex_weights.js'),
    SubindexWeight = require('app/models/subindex_weights.js'),
    co = require('co'),
    Query = require('app/util').Query,
    getTranslateQuery = require('app/util').getTranslateQuery,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
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
        co(function* () {
            var curStepAlias = 'curStep';
            return yield thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
                        'WHEN (' +
                            'SELECT ' +
                                '"Discussions"."id" ' +
                            'FROM "Discussions" ' +
                            'WHERE "Discussions"."taskId" = "Tasks"."id" ' +
                            'AND "Discussions"."isReturn" = true ' +
                            'AND "Discussions"."isResolve" = false ' +
                            'LIMIT 1' +
                            ') IS NULL ' +
                        'THEN FALSE ' +
                        'ELSE TRUE ' +
                    'END as flagged',
                    'CASE ' +
                        'WHEN "' + curStepAlias + '"."position" IS NULL AND ("WorkflowSteps"."position" = 0) THEN \'current\' ' +
                        'WHEN "' + curStepAlias + '"."position" IS NULL AND ("WorkflowSteps"."position" <> 0) THEN \'waiting\' ' +
                        'WHEN "' + curStepAlias + '"."position" = "WorkflowSteps"."position" THEN \'current\' ' +
                        'WHEN "' + curStepAlias + '"."position" < "WorkflowSteps"."position" THEN \'waiting\' ' +
                        'WHEN "' + curStepAlias + '"."position" > "WorkflowSteps"."position" THEN \'completed\' ' +
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

                if (req.body[i].id) { // update
                    var updateObj = _.pick(
                      req.body[i],
                      Task.editCols
                    );
                    if(Object.keys(updateObj).length){
                        var update = yield thunkQuery(Task.update(updateObj).where(Task.id.equals(req.body[i].id)));
                        updateObj.id = req.body[i].id;
                        res.updated.push(req.body[i].id);
                    }
                } else { // create
                    var id = yield thunkQuery(
                      Task.insert(_.pick(req.body[i], Task.table._initialConfig.columns)).returning(Task.id)
                    );
                    req.body[i].id = _.first(id).id;
                    res.inserted.push(req.body[i].id);
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
    co(function* (){
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
                  '("Tasks"."productId" = ' + parseInt(req.params.id) + ') ' +
              ')';
        console.log(q);


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

    indexes: function (req, res, next) {
        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getIndexes(productId);
        }).then(function (indexes) {
            res.json(indexes);
        }, function (err) {
            next(err);
        });
    },

    editIndexes: function (req, res, next) {
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

                    // drop all existing weights
                    yield thunkQuery(IndexQuestionWeight.delete().where(IndexQuestionWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    yield thunkQuery(IndexSubindexWeight.delete().where(IndexSubindexWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
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
                }
                for (var subindexId in req.body[i].subindexWeights) {
                    var weightObj = {
                        indexId: indexId,
                        subindexId: subindexId,
                        weight: req.body[i].subindexWeights[subindexId].weight,
                        type: req.body[i].subindexWeights[subindexId].type
                    };
                    yield thunkQuery(IndexSubindexWeight.insert(weightObj));
                }
            }

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },


    subindexes: function (req, res, next) {
        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getSubindexes(productId);
        }).then(function (subindexes) {
            res.json(subindexes);
        }, function (err) {
            next(err);
        });
    },

    editSubindexes: function (req, res, next) {
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

                    // drop all existing weights
                    yield thunkQuery(SubindexWeight.delete().where(SubindexWeight.subindexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });

                    subindexId = req.body[i].id;
                    res.updated.push(subindexId);
                } else { // create
                    subindexObj.productId = req.params.id;
                    var id = yield thunkQuery(Subindex.insert(subindexObj).returning(Subindex.id), {
                        'realm': req.param('realm')
                    });

                    subindexId = _.first(id).id;
                    res.inserted.push(subindexId);
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
                }
            }

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    aggregateIndexes: function (req, res, next) {
        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(productId);
        }).then(function (result) {
            res.json(result);
        }, function (err) {
            next(err);
        });
    },  

    aggregateIndexesCsv: function (req, res, next) {
        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(productId);
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
        var q = Product.delete().where(Product.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkProductData(req);
            if (parseInt(req.body.status) === 1) { // if status changed to 'STARTED'
                yield * updateCurrentStepId(req);
            }
            return yield thunkQuery(Product.update(_.pick(req.body, Product.editCols)).where(Product.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkProductData(req);
            var result = yield thunkQuery(
                Product.insert(_.pick(req.body, Product.table._initialConfig.columns)).returning(Product.id)
            );
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    UOAselect: function (req, res, next) {
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
        query(ProductUOA.insert({
            productId: req.params.id,
            UOAid: req.params.uoaid
        }), function (err, data) {
            if (!err) {
                res.status(201).end();
            } else {
                next(err);
            }
        });
    },

    UOAaddMultiple: function (req, res, next) {
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

            return yield thunkQuery(ProductUOA.insert(insertArr));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    UOAdelete: function (req, res, next) {
        query(ProductUOA.delete().where({
            productId: req.params.id,
            UOAid: req.params.uoaid
        }), function (err, data) {
            if (!err) {
                res.status(204).end();
            } else {
                next(err);
            }
        });
    }

};

function* checkProductData(req) {
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

    var result;
    // get min step position for specified productId
    var minStepPositionQuery =
        'SELECT '+
        'min("WorkflowSteps"."position") as "minPosition", '+
        '"Workflows"."productId" '+
        'FROM '+
        '"WorkflowSteps" '+
        'INNER JOIN "Workflows" ON "WorkflowSteps"."workflowId" = "Workflows"."id" '+
        'WHERE '+
        '"Workflows"."productId" = '+req.params.id+' '+
        'group by "Workflows"."productId"';


    result = yield thunkQuery(minStepPositionQuery);
    if (!_.first(result)) {
        return;
    }
    var minStepPosition = result[0].minPosition;

    // get step ID with min step position for specified productId
    var stepIdMinPositionQuery =
        'SELECT '+
        '"WorkflowSteps"."id" '+
        'FROM '+
        '"WorkflowSteps" '+
        'INNER JOIN "Workflows" ON "WorkflowSteps"."workflowId" = "Workflows"."id" '+
        'WHERE '+
        '"Workflows"."productId" = '+req.params.id+' AND '+
        '"WorkflowSteps"."position" = '+minStepPosition;

    result = yield thunkQuery(stepIdMinPositionQuery);
    if (!_.first(result)) {
        return;
    }
    var stepIdMinPosition = result[0].id;

    yield thunkQuery(
        ProductUOA.update({isComplete: false}).where(ProductUOA.productId.equals(req.params.id))
    );

    // update all currentStepId with min position step ID for specified productId
    var updateProductUOAQuery =
        'UPDATE "ProductUOA" '+
        'SET "currentStepId" = ' +stepIdMinPosition+ ' '+
        'WHERE "productId"= '+req.params.id+ ' AND "currentStepId" is NULL';
    result = yield thunkQuery(updateProductUOAQuery);

}

function* dumpProduct(productId) {
  var q =
          'SELECT ' + 
          '  "SurveyAnswers"."UOAid" AS "id", ' + 
          '  "UnitOfAnalysis"."name", ' + 
          '  "UnitOfAnalysis"."ISO2", ' + 
          "  format('{%s}', " + 
          "    string_agg(format('\"%s\":%s', " +
          '      "SurveyQuestions".id, ' + 
          '      CASE ' +
          '        WHEN "SurveyAnswers"."value" is null THEN format(\'[%s]\', array_to_string("SurveyAnswers"."optionId", \',\')) ' +
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
          '    ("SurveyAnswers"."productId" = ' + productId + ')' +
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
          '    ("SurveyAnswers"."productId" = ' + productId + ')' +
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
          '  AND ("SurveyAnswers"."productId" = ' + productId + ')' +
          ') ' +
          'LEFT JOIN ' +
          '  "UnitOfAnalysis" ON ("UnitOfAnalysis"."id" = "SurveyAnswers"."UOAid") ' +
          'WHERE ' +
          '  ("Products"."id" = ' + productId + ')' +
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

function* getSubindexes(productId) {
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
          '  ("Subindexes"."productId" = ' + productId + ') ' +
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

function* getIndexes(productId) {
    q =
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

function* parseNumericalAnswer(raw, questionType) {
    var parsed;
    if (questionType === 5 || questionType === 7) { // numerical or currency
        parsed = parseFloat(raw);
    } else if (questionType === 3 || questionType === 4) { // single selection
        var selected = (yield thunkQuery(
            SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(raw))
        ))[0];

        parsed = parseFloat(selected.value);
    } else if (questionType === 2) { // multiple selection
        // selected options
        var selected = [];
        for (var j = 0; j < raw.length; j++) {
            selected.push((yield thunkQuery(
                SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(raw[j]))
            ))[0]);
        }

        parsed = selected.map(function (selection) {
            return parseFloat(selection.value);
        });
    } else {
        console.log("Aggregation: Parsed %d from %s", parsed, raw);
        console.log("Aggregation: Non-numerical question of type %d", questionType);
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

function filterData(data, questions, indexes, subindexes) {
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
            } else {
                delete data[i].questions[questionId];
            }
        }
    }

    // filter questions
    questions = questions.filter(function (question) {
        return questionsPresent.has(question.id.toString());
    });

    return { data: data, questions: questions };
}

function* parseNumericalAnswers(data, questions) {
    // type of each question
    var questionTypes = {};
    questions.forEach(function (question) {
        questionTypes[question.id] = question.type;
    });

    for (var i = 0; i < data.length; i++) {
        for (var questionId in data[i].questions) {
            data[i].questions[questionId] = yield parseNumericalAnswer(
                data[i].questions[questionId],
                questionTypes[questionId]
            );
        }
    }

    return data;
}

function* getQuestions(productId) {
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
            if (datum[id].constructor === Array) { // array of values
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
            } else { // single value
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

        if (val.constructor === Array) {
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

function* aggregateIndexes(productId) {
    // get data
    var data = yield dumpProduct(productId);
    var subindexes = yield getSubindexes(productId);
    var indexes = yield getIndexes(productId);
    var questions = yield getQuestions(productId);

    // initial preprocessing
    var filtered = filterData(data, questions, indexes, subindexes);
    questions = filtered.questions;
    data = yield parseNumericalAnswers(filtered.data, questions);

    // precalculate min/max of questions for subindex percentile calculations
    qMinsMaxes = calcMinsMaxes(_.pluck(data, 'questions'));

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
