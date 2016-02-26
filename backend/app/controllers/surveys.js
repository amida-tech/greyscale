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
        	req.query.realm = req.param('realm');
            return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var data = yield thunkQuery(
                Survey
                .select(
                    Survey.star(),
                    '(WITH sq AS ' +
                        '( '+
                            'SELECT '+
                                '"SurveyQuestions".* , '+
                                'array_agg(row_to_json("SurveyQuestionOptions".*)) as options '+
                            'FROM '+
                                '"SurveyQuestions" '+
                            'LEFT JOIN '+
                                '"SurveyQuestionOptions" '+
                            'ON '+
                                '"SurveyQuestions"."id" = "SurveyQuestionOptions"."questionId" '+
                            'WHERE "SurveyQuestions"."surveyId" = "Surveys"."id" '+
                            'GROUP BY "SurveyQuestions"."id" '+
                            'ORDER BY '+
                            '"SurveyQuestions"."position" '+
                        ') '+
                    'SELECT array_agg(row_to_json(sq.*)) as questions FROM sq )'
                )
                .where(Survey.id.equals(req.params.id))
                .group(Survey.id), {'realm': req.param('realm')}
            );
            if (_.first(data)) {
                return data;
            } else {
                throw new HttpError(404, 'Not found');
            }
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        co(function* () {
            var products = yield thunkQuery(Product.select().where(Product.surveyId.equals(req.params.id)), {'realm': req.param('realm')});
            if (_.first(products)) {
                throw new HttpError(403, 'This survey has already linked with some product(s), you cannot delete it');
            }
            var questions = yield thunkQuery(SurveyQuestion.select().where(SurveyQuestion.surveyId.equals(req.params.id)), 
            		{'realm': req.param('realm')});
            if (questions.length) {
                for (var i in questions) {
                    yield thunkQuery(SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(questions[i].id))); // delete options
                    yield thunkQuery(SurveyQuestion.delete().where(SurveyQuestion.id.equals(questions[i].id))); // delete question
                }
            }
            yield thunkQuery(Survey.delete().where(Survey.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    editOne: function (req, res, next) {
        co(function* () {
            yield * checkSurveyData(req);
            return yield thunkQuery(
                Survey
                .update(_.pick(req.body, Survey.editCols))
                .where(Survey.id.equals(req.params.id)),
                {'realm': req.param('realm')}
            );
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkSurveyData(req);

            var survey = yield thunkQuery(
                Survey.insert(_.pick(req.body, Survey.table._initialConfig.columns)).returning(Survey.id),
                {'realm': req.param('realm')}
            );

            survey = survey[0];

            if (req.body.questions) {
                survey.questions = [];
                req.params.id = survey.id;
                for (var i in req.body.questions) {
                    var question = yield* addQuestion(req, req.body.questions[i]);
                    survey.questions.push(question);
                }
            }

            return survey;
        }).then(function (data) {
            res.status(201).json(data);
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
                .from(
                    SurveyQuestion
                    .leftJoin(SurveyQuestionOption)
                    .on(SurveyQuestion.id.equals(SurveyQuestionOption.questionId))
                )
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
            return yield* addQuestion(req, req.body);
        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    questionEdit: function (req, res, next) {
        co(function* () {
            yield * checkQuestionData(req, req.body, false);
            return yield thunkQuery(
                SurveyQuestion
                .update(_.pick(req.body, SurveyQuestion.editCols))
                .where(SurveyQuestion.id.equals(req.params.id)),
                {'realm': req.param('realm')}
            );
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
            });
    }

};

function* addQuestion (req, dataObj) {

    yield * checkQuestionData(req, dataObj, true);
    var result = yield thunkQuery(
        SurveyQuestion
            .insert(_.pick(dataObj, SurveyQuestion.table._initialConfig.columns))
            .returning(SurveyQuestion.id)
    );
    result = result[0];

    if (dataObj.options) {
        var insertArr = [];
        for (var i in dataObj.options) {
            var insertObj = _.pick(dataObj.options[i], SurveyQuestionOption.table._initialConfig.columns);
            insertObj.questionId = result.id;
            insertArr.push(insertObj);
        }
        result.options = yield thunkQuery(
            SurveyQuestionOption.insert(insertArr).returning(SurveyQuestionOption.id),
            {'realm': req.param('realm')}
        );
    }

    return result;
}

function* checkSurveyData(req) {
    if (!req.params.id) { // create
        if (!req.body.title || !req.body.projectId) {
            throw new HttpError(403, 'projectId and title fields are required');
        }
    }

    if (req.body.projectId) {
        var project = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
        if (!_.first(project)) {
            throw new HttpError(403, 'Project with id = ' + req.body.projectId + ' does not exists');
        }
    }
}

function* checkQuestionData(req, dataObj, isCreate) {
    if (isCreate) {
        if (
            typeof dataObj.label === 'undefined' ||
            //typeof req.body.surveyId == 'undefined' ||
            typeof dataObj.type === 'undefined'
        ) {
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

    var surveyId = isCreate ? req.params.id : dataObj.surveyId;

    //if (surveyId) {
    //    var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(surveyId)));
    //    if (!_.first(survey)) {
    //        throw new HttpError(403, 'Survey with id = ' + surveyId + ' does not exist');
    //    }
    //    dataObj.surveyId = surveyId;
    //}

    if (dataObj.type) {
        if (SurveyQuestion.types.indexOf(parseInt(dataObj.type)) === -1) {
            throw new HttpError(
                403,
                'Type value should be from 0 till ' + SurveyQuestion.types[SurveyQuestion.types.length-1]
            );
        }
    }

    var maxPos = yield thunkQuery(
        SurveyQuestion.select('max("SurveyQuestions"."position")').where(SurveyQuestion.surveyId.equals(surveyId))
    );

    var nextPos = 1;

    if (_.first(maxPos)) {
        nextPos = _.first(maxPos).max + 1;
    }

    //TODO: Need to update the manual queries below to specify schema
    if (isCreate || typeof dataObj.position !== 'undefined') {
        dataObj.position = isNaN(parseInt(dataObj.position)) ? 0 : parseInt(dataObj.position);

        if (dataObj.position > nextPos || dataObj.position < 1) {
            dataObj.position = nextPos;
        } else {
            if ((isCreate && _.first(maxPos))) {
                yield thunkQuery(
                    'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                    'WHERE (' +
                    '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                    'AND ("SurveyQuestions"."position" >= ' + dataObj.position + ')' +
                    ')'

                    // TODO cannot increment position via ORM
                    //SurveyQuestion.update({position : position+1})
                    //    .where(SurveyQuestion.surveyId.equals(surveyId))
                    //    .and(SurveyQuestion.position.gte(req.body.position))
                );
            }
            if (!isCreate && (question.position !== dataObj.position)) {
                if (question.position < dataObj.position) {
                    var q =
                        'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                        'WHERE (' +
                        '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                        'AND ("SurveyQuestions"."position" > ' + question.position + ')' +
                        'AND ("SurveyQuestions"."position" <= ' + dataObj.position + ')' +
                        ')';
                } else {
                    var q =
                        'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                        'WHERE (' +
                        '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                        'AND ("SurveyQuestions"."position" < ' + question.position + ')' +
                        'AND ("SurveyQuestions"."position" >= ' + dataObj.position + ')' +
                        ')';
                }

                yield thunkQuery(q);
            }

        }
    }

}
