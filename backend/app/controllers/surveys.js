var
  _ = require('underscore'),
  Survey = require('app/models/surveys'),
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
    co(function* (){
      return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
    }).then(function(data){
      res.json(data);
    }, function(err){
      next(err);
    });

  },

  selectOne: function (req, res, next) {
    var q = Survey.select().from(Survey).where(Survey.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      if(_.first(data)){
        res.json(_.first(data));  
      }else{
        return next(new HttpError(404, 'Not found'));
      }
      
    });
  },

  delete: function (req, res, next) {
    var q = Survey.delete().where(Survey.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  },

  editOne: function (req, res, next) {
    if(req.body.data){
      var q = Survey.update(req.body).where(Survey.id.equals(req.params.id));
      query(q, function (err, data) {
        if (err) {
          return next(err);
        }
        res.status(202).end();
      });
    }else{
      return next(new HttpError(400, 'No data to update'));
    }
  },

  insertOne: function (req, res, next) {
    var q = Survey.insert(req.body).returning(Survey.id);
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(201).json(_.first(data));
    });
  },

  questions: function (req, res, next) {
    co(function* (){
      var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));
      if(!_.first(survey)){
        throw new HttpError(403, 'Survey with id = ' + req.params.id + ' does nor exist');
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
      var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));
      if(!_.first(survey)){
        throw new HttpError(403, 'Survey with id = ' + req.params.id + ' does nor exist');
      }
      req.body.surveyId = req.params.id;
      var result = yield thunkQuery(SurveyQuestion.insert(req.body).returning(SurveyQuestion.id));
      return result;
    }).then(function(data){
      res.status(201).json(_.first(data));
    }, function(err){
      next(err);
    });
  },

  questionEdit: function (req, res, next) {
    co(function* (){
      return yield thunkQuery(SurveyQuestion.update(req.body).where(SurveyQuestion.id.equals(req.params.id)));
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
