var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    Product = require('app/models/products'),
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
        	req.query.realm = req.param('realm');
            return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var q = Survey.select().from(Survey).where(Survey.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                return next(new HttpError(404, 'Not found'));
            }

        });
    },

    delete: function (req, res, next) {
        var q = Survey.delete().where(Survey.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    editOne: function (req, res, next) {
        co(function* () {
            yield * checkSurveyData(req);
            return yield thunkQuery(Survey.update(_.pick(req.body, Survey.table._initialConfig.columns)).where(Survey.id.equals(req.params.id)),
            		{'realm': req.param('realm')});
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkSurveyData(req);
            return yield thunkQuery(Survey.insert(_.pick(req.body, Survey.table._initialConfig.columns)).returning(Survey.id),
            		{'realm': req.param('realm')});
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    questions: function (req, res, next) {
        co(function* () {
            var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));
            if (!_.first(survey)) {
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
                .group(SurveyQuestion.id),
                {'realm': req.param('realm')} 
            );
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    questionAdd: function (req, res, next) {
        co(function* () {
            yield * checkQuestionData(req, true);
            var result = yield thunkQuery(SurveyQuestion.insert(req.body).returning(SurveyQuestion.id),
            		{'realm': req.param('realm')});
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    questionEdit: function (req, res, next) {
        co(function* () {
            yield * checkQuestionData(req, false);
            return yield thunkQuery(SurveyQuestion.update(req.body).where(SurveyQuestion.id.equals(req.params.id)),
            		{'realm': req.param('realm')} );
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    questionDelete: function (req, res, next) {
        query(SurveyQuestion.delete().where(SurveyQuestion.id.equals(req.params.id)),{'realm': req.param('realm')} , 
        	function (err, data) {
	            if (err) {
	                return next(err);
	            }
	            res.status(204).end();
            }
        );
    }

};

function* checkSurveyData(req) {
    if (!req.params.id) { // create
        if (!req.body.title || !req.body.productId) {
            throw new HttpError(403, 'productId and title fields are required');
        }
    }

    if (req.body.productId) {
        var product = yield thunkQuery(Product.select().where(Product.id.equals(req.body.productId)));
        if (!_.first(product)) {
            throw new HttpError(403, 'Product with id = ' + req.body.productId + ' does not exists');
        }
    }
}

function* checkQuestionData(req, isCreate) {
    if (isCreate) {
        if (!req.body.label || !req.body.surveyId || !req.body.type) {
            throw new HttpError(403, 'label, surveyId and type field are required');
        }
    }

    var surveyId = isCreate ? req.params.id : req.body.surveyId;

    if (surveyId) {
        var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(surveyId)));
        if (!_.first(survey)) {
            throw new HttpError(403, 'Survey with id = ' + surveyId + ' does not exist');
        }
        req.body.surveyId = surveyId;
    }

    if (req.body.type) {
        if ((parseInt(req.body.type)) < 0 || (parseInt(req.body.type) > 10)) {
            throw new HttpError(403, 'Type value should be from 0 till 11');
        }
    }

}
