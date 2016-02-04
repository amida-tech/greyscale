var
  _ = require('underscore'),
  Survey = require('app/models/surveys'),
  Product = require('app/models/products'),
  Project = require('app/models/projects'),
  SurveyQuestion = require('app/models/survey_questions'),
  SurveyQuestionOption = require('app/models/survey_question_options'),
  co = require('co'),
  Query = require('app/util').Query,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);


module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* (){
            var data = yield thunkQuery(
                Survey
                .select(
                    Survey.star(),
                    'array_agg(row_to_json("SurveyQuestions".*) ORDER BY "SurveyQuestions"."position") as questions'
                )
                .from(
                    Survey
                    .leftJoin(SurveyQuestion)
                    .on(Survey.id.equals(SurveyQuestion.surveyId))
                )
                .where(Survey.id.equals(req.params.id))
                .group(Survey.id)
            );
            if (_.first(data)) {
                return data;
            } else {
                throw new HttpError(404, 'Not found');
            }
        }).then(function(data){
            res.json(_.first(data));
        },function(err){
            next(err);
        });
    },

    delete: function (req, res, next) {
        co(function*(){
            var products = yield thunkQuery(Product.select().where(Product.surveyId.equals(req.params.id)));
            if (_.first(products)) {
                throw new HttpError(403, 'This survey has already linked with some product(s), you cannot delete it');
            }
            var questions = yield thunkQuery(SurveyQuestion.select().where(SurveyQuestion.surveyId.equals(req.params.id)));
            if(questions.length){
                for(var i in questions){
                    yield thunkQuery(SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(questions[i].id))); // delete options
                    yield thunkQuery(SurveyQuestion.delete().where(SurveyQuestion.id.equals(questions[i].id))); // delete question
                }
            }
            yield thunkQuery(Survey.delete().where(Survey.id.equals(req.params.id)));
        }).then(function(data){
            res.status(204).end();
        }, function(err){
            next(err);
        });
    },

    editOne: function (req, res, next) {
        co(function*(){
            yield* checkSurveyData(req);
            return yield thunkQuery(
                Survey
                .update(_.pick(req.body, Survey.table._initialConfig.columns))
                .where(Survey.id.equals(req.params.id))
            );
        }).then(function(data) {
            res.status(202).end();
        }, function(err) {
            next(err);
        });
    },

  insertOne: function (req, res, next) {
    co(function*(){
        yield* checkSurveyData(req);

        var survey = yield thunkQuery(
            Survey.insert(_.pick(req.body, Survey.table._initialConfig.columns)).returning(Survey.id)
        );
        // TODO survey questions
        //if (req.body.questions) {
        //    for (var i in req.body.questions)
        //    console.log('q=' + req.body.questions);
        //}

        return survey;
    }).then(function(data) {
        res.status(201).json(_.first(data));
    }, function(err) {
        next(err);
    });
  },

  questions: function (req, res, next) {
    co(function* (){
      var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));
      if(!_.first(survey)){
        throw new HttpError(403, 'Survey with id = ' + req.params.id + ' does not exist');
      }
      var result = yield thunkQuery(
          SurveyQuestion
          .select(
              SurveyQuestion.star(),
              'array_agg(row_to_json("SurveyQuestionOptions".*)) as answers'
          )
          .from(SurveyQuestion.leftJoin(SurveyQuestionOption).on(SurveyQuestion.id.equals(SurveyQuestionOption.questionId)))
          .where(SurveyQuestion.surveyId.equals(req.params.id))
          .group(SurveyQuestion.id)
      );
      return result;
    }).then(function(data){
      res.json(data);
    }, function(err){
      next(err);
    });
  },

  questionAdd: function (req, res, next) {
    co(function* (){
      yield* checkQuestionData(req, true);
      var result = yield thunkQuery(
          SurveyQuestion
          .insert(_.pick(req.body, ['label','surveyId','type','position','isRequired']))
          .returning(SurveyQuestion.id)
      );
      return result;
    }).then(function(data){
      res.status(201).json(_.first(data));
    }, function(err){
      next(err);
    });
  },

  questionEdit: function (req, res, next) {
    co(function* (){
      yield* checkQuestionData(req, false);
      return yield thunkQuery(
          SurveyQuestion
          .update(_.pick(req.body, ['label','position','isRequired']))
          .where(SurveyQuestion.id.equals(req.params.id))
      );
    }).then(function(data){
      res.status(202).end();
    }, function(err){
      next(err);
    });
  },

  questionDelete: function (req, res, next) {
    query(SurveyQuestion.delete().where(SurveyQuestion.id.equals(req.params.id)), function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  }

};

function* checkSurveyData(req) {
    if(!req.params.id){ // create
        if(!req.body.title || !req.body.projectId){
            throw new HttpError(403, 'projectId and title fields are required');
        }
    }

    if(req.body.projectId){
        var project = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
        if(!_.first(project)){
            throw new HttpError(403, 'Project with id = ' + req.body.projectId + ' does not exists');
        }
    }
}

function* checkQuestionData(req, isCreate) {
    if (isCreate) {
        if(
            typeof req.body.label == 'undefined' ||
            //typeof req.body.surveyId == 'undefined' ||
            typeof req.body.type == 'undefined'
        ){
            throw new HttpError(403, 'label, surveyId(in params) and type fields are required');
        }
    } else {
        var question = yield thunkQuery(
            SurveyQuestion.select().where(SurveyQuestion.id.equals(req.params.id))
        );
        if (!_.first(question)) {
            throw new HttpError(403, 'Survey question with id = ' + req.params.id + 'does not exist');
        }
        question = _.first(question);
    }

    var surveyId = isCreate ? req.params.id : req.body.surveyId;

    if (surveyId) {
        var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(surveyId)));
        if(!_.first(survey)){
            throw new HttpError(403, 'Survey with id = ' + surveyId + ' does not exist');
        }
        req.body.surveyId = surveyId;
    }

    if (req.body.type) {
        if((parseInt(req.body.type)) < 0 || (parseInt(req.body.type) > 10)){
            throw new HttpError(403, 'Type value should be from 0 till 11');
        }
    }

    var maxPos = yield thunkQuery(
        SurveyQuestion.select('max("SurveyQuestions"."position")').where(SurveyQuestion.surveyId.equals(surveyId))
    );

    var nextPos = 1;

    if(_.first(maxPos)){
        nextPos = _.first(maxPos).max + 1;
    }

    if (isCreate || typeof req.body.position != 'undefined') {
        req.body.position = isNaN(parseInt(req.body.position)) ? 0 : parseInt(req.body.position);

        if (req.body.position > nextPos || req.body.position < 1) {
            req.body.position = nextPos;
        } else {
            if ((isCreate && _.first(maxPos))){
                yield thunkQuery(
                    'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                    'WHERE (' +
                        '("SurveyQuestions"."surveyId" = '+ surveyId +') ' +
                        'AND ("SurveyQuestions"."position" >= '+ req.body.position +')' +
                    ')'

                    // TODO cannot increment position via ORM
                    //SurveyQuestion.update({position : position+1})
                    //    .where(SurveyQuestion.surveyId.equals(surveyId))
                    //    .and(SurveyQuestion.position.gte(req.body.position))
                );
            }
            if (!isCreate && (question.position != req.body.position)) {
                if (question.position < req.body.position) {
                    var q =
                        'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                        'WHERE (' +
                        '("SurveyQuestions"."surveyId" = '+ surveyId +') ' +
                        'AND ("SurveyQuestions"."position" > '+ question.position +')' +
                        'AND ("SurveyQuestions"."position" <= '+ req.body.position +')' +
                        ')';
                }else{
                    var q =
                        'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                        'WHERE (' +
                        '("SurveyQuestions"."surveyId" = '+ surveyId +') ' +
                        'AND ("SurveyQuestions"."position" < '+ question.position +')' +
                        'AND ("SurveyQuestions"."position" >= '+ req.body.position +')' +
                        ')';
                }

                yield thunkQuery(q);
            }

        }
    }

}
