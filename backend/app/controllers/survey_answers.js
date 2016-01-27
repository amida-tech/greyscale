var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    SurveyAnswer = require('app/models/survey_answers'),
    SurveyQuestion = require('app/models/survey_questions'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(SurveyAnswer.select().from(SurveyAnswer), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var q = SurveyAnswer.select().from(SurveyAnswer).where(SurveyAnswer.id.equals(req.params.id));
        query(q, function (err, data) {
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
        var q = SurveyAnswer.delete().where(SurveyAnswer.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    editOne: function (req, res, next) {
        if (req.body.data) {
            var q = SurveyAnswer.update({
                data: req.body.data
            }).where(SurveyAnswer.id.equals(req.params.id));
            query(q, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.status(202).end();
            });
        } else {
            return next(new HttpError(400, 'No data to update'));
        }
    },

    insertOne: function (req, res, next) {
        co(function* () {
            var question = yield thunkQuery(SurveyQuestion.select().from(SurveyQuestion).where(SurveyQuestion.id.equals(req.body.questionId)));
            if (!_.first(question)) {
                throw new HttpError(403, 'Question with id = '+ req.body.questionId +' does not exist');
            }
            req.body.userId = req.user.id;
            return yield thunkQuery(SurveyAnswer.insert(req.body).returning(SurveyAnswer.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    }

};
