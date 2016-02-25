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
    SurveyAnswer = require('app/models/survey_answers'),
    User = require('app/models/users'),
    EssenceRole = require('app/models/essence_roles'),
    AccessMatrix = require('app/models/access_matrices'),
    ProductUOA = require('app/models/product_uoa'),
    Task = require('app/models/tasks'),
    UOA = require('app/models/uoas'),
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
            return yield thunkQuery(
                Task
                .select(
                    Task.star()
                )
                .from(
                    Task
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
            // TODO validation
            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                req.body[i].productId = req.params.id;

                if (
                    typeof req.body[i].uoaId === 'undefined' ||
                    typeof req.body[i].stepId === 'undefined' ||
                    typeof req.body[i].entityTypeRoleId === 'undefined' ||
                    typeof req.body[i].productId === 'undefined'
                    //typeof req.body[i].title            === 'undefined'
                ) {
                    throw new HttpError(403, 'uoaId, stepId, entityTypeRoleId, productId and title fields are required');
                }

        if(req.body[i].id){ // update
          var updateObj = _.pick(
              req.body[i],
              Task.editCols
          );
          if(Object.keys(updateObj).length){
            var update = yield thunkQuery(Task.update(updateObj).where(Task.id.equals(req.body[i].id)));
            updateObj.id = req.body[i].id;
            res.updated.push(req.body[i].id);
          }
        }else{ // create
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
              '"Users"."id" as "ownerId", concat("Users"."firstName",\' \', "Users"."lastName") as "ownerName", "Roles"."name" as "ownerRole", ' +
              '"Surveys"."title" as "surveyTitle", ' +
              '"SurveyQuestions"."label" as "questionTitle", "SurveyQuestions"."qid" as "questionCode", "SurveyQuestions"."value" as "questionWeight", ' +
              '"SurveyAnswers"."value" as "answerText", "SurveyAnswers"."optionId" as "answerValue" ' +

              'FROM "Tasks" ' +
              'LEFT JOIN "Products" ON ("Tasks"."productId" = "Products"."id") ' +
              'LEFT JOIN "UnitOfAnalysis" ON ("Tasks"."uoaId" = "UnitOfAnalysis"."id") ' +
              'LEFT JOIN "UnitOfAnalysisType" ON ("UnitOfAnalysisType"."id" = "UnitOfAnalysis"."unitOfAnalysisType") ' +
              'LEFT JOIN "WorkflowSteps" ON ("Tasks"."stepId" = "WorkflowSteps"."id") ' +
              'LEFT JOIN "EssenceRoles" ON ("Tasks"."entityTypeRoleId" = "EssenceRoles"."id") ' +
              'LEFT JOIN "Users" ON ("EssenceRoles"."userId" = "Users"."id") ' +
              'LEFT JOIN "Roles" ON ("EssenceRoles"."roleId" = "Roles"."id") ' +
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

    // update all currentStepId with min position step ID for specified productId
    var updateProductUOAQuery =
        'UPDATE "ProductUOA" '+
        'SET "currentStepId" = ' +stepIdMinPosition+ ' '+
        'WHERE "productId"= '+req.params.id+ ' AND "currentStepId" is NULL';
    result = yield thunkQuery(updateProductUOAQuery);

}
