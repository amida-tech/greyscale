var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    SurveyAnswer = require('app/models/survey_answers'),
    SurveyAnswerVersion = require('app/models/survey_answer_versions'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    User = require('app/models/users'),
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

    //editOne: function (req, res, next) {
    //    if (req.body.data) {
    //        var q = SurveyAnswer.update({
    //            data: req.body.data
    //        }).where(SurveyAnswer.id.equals(req.params.id));
    //        query(q, function (err, data) {
    //            if (err) {
    //                return next(err);
    //            }
    //            res.status(202).end();
    //        });
    //    } else {
    //        return next(new HttpError(400, 'No data to update'));
    //    }
    //},

    add: function (req, res, next) {
        co(function* () {
            var question = yield thunkQuery(
                SurveyQuestion.select().from(SurveyQuestion).where(SurveyQuestion.id.equals(req.body.questionId))
            );

            if (!_.first(question)) {
                throw new HttpError(403, 'Question with id = '+ req.body.questionId +' does not exist');
            }

            var user = yield thunkQuery(User.select().where(User.id.equals(req.body.userId)));

            if(!_.first(user)){
                throw new HttpError(403, 'User with id = '+ req.body.userId + ' does not exist');
            }

            var isRewriter = false; //TODO

            if (!isRewriter && (req.body.userId != req.user.id)) {
                throw new HttpError(403, 'You cannot answer for another user');
            }

            var answer = yield thunkQuery(
                SurveyAnswer.select()
                .where(
                    SurveyAnswer.userId.equals(req.body.userId)
                    .and(SurveyAnswer.userId.equals(req.body.userId))
                )
            );

            if(!_.first(answer)){ // new answer, create...
                var result = yield thunkQuery(SurveyAnswer.insert(_.pick(req.body,['userId','questionId'])).returning(SurveyAnswer.id));
                var answerId = _.first(result).id;
            }else{
                var answerId = answer.id;
            }
            console.log(_.first(question).type);
            if([2,3,4].indexOf(_.first(question).type) != -1){ // question with options
                if(!req.body.optionId){
                    throw new HttpError(403, 'You should provide optionId for this type of question');
                }else{
                    var option = yield thunkQuery(SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(req.body.optionId)));
                    if(!_.first(option)){
                        throw new HttpError(403, 'Option with id = ' + req.body.optionId + ' does not exist');
                    }

                    if(_.first(option).questionId != req.body.questionId){
                        throw new HttpError(403, 'This option does not relate to this question');
                    }
                }
            }else{
                if(!req.body.value){
                    throw new HttpError(403, 'You should provide value for this type of question');
                }
            }

            req.body.userId = req.user.id;
            var version = yield thunkQuery(
                SurveyAnswerVersion
                    .insert(_.pick(req.body,['userId', 'optionId', 'value', 'comment']))
                    .returning(SurveyAnswerVersion.id)
            );

            return version;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    }

};
