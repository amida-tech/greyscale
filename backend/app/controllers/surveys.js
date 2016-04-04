var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
                    'SELECT array_agg(row_to_json(sq.*)) as questions FROM sq)'
                )
                .where(Survey.id.equals(req.params.id))
                .group(Survey.id)
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var products = yield thunkQuery(
                Product.select().where(Product.surveyId.equals(req.params.id))
            );
            if (_.first(products)) {
                throw new HttpError(403, 'This survey has already linked with some product(s), you cannot delete it');
            }
            var questions = yield thunkQuery(
                SurveyQuestion.select().where(SurveyQuestion.surveyId.equals(req.params.id))
            );
            if (questions.length) {
                for (var i in questions) {
                    yield thunkQuery(
                        SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(questions[i].id))
                    ); // delete options
                    bologger.log({
                        req: req,
                        user: req.user.realmUserId,
                        action: 'delete',
                        object: 'SurveyQuestionOptions',
                        entities: {questionId: questions[i].id},
                        quantity: 1,
                        info: 'Delete survey question options for question '+questions[i].id
                    });

                    yield thunkQuery(
                        SurveyQuestion.delete().where(SurveyQuestion.id.equals(questions[i].id))
                    ); // delete question
                    bologger.log({
                        req: req,
                        user: req.user.realmUserId,
                        action: 'delete',
                        object: 'SurveyQuestions',
                        entity: questions[i].id,
                        info: 'Delete survey question'
                    });
                }
            }
            yield thunkQuery(Survey.delete().where(Survey.id.equals(req.params.id)));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'delete',
                object: 'Surveys',
                entity: req.params.id,
                info: 'Delete survey'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    editOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkSurveyData(req);
            var updateObj = req.body;
            updateObj = _.pick(updateObj, Survey.editCols);

            if(Object.keys(updateObj).length){
                yield thunkQuery(
                    Survey
                        .update(updateObj)
                        .where(Survey.id.equals(req.params.id))
                );
                bologger.log({
                    req: req,
                    user: req.user.realmUserId,
                    action: 'update',
                    object: 'surveys',
                    entity: req.params.id,
                    info: 'Update survey'
                });
            }
            // delete all SurveyQuestions and SurveyQuestionOptions
            var questions = yield thunkQuery(
                SurveyQuestion.select().where(SurveyQuestion.surveyId.equals(req.params.id))
            );
            if (questions.length) {
                for (var i in questions) {
                    yield thunkQuery(
                        SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(questions[i].id))
                    ); // delete options
                    bologger.log({
                        req: req,
                        user: req.user.realmUserId,
                        action: 'delete',
                        object: 'SurveyQuestionOptions',
                        entities: {questionId: questions[i].id},
                        quantity: 1,
                        info: 'Delete survey question options for question '+questions[i].id
                    });

                    yield thunkQuery(
                        SurveyQuestion.delete().where(SurveyQuestion.id.equals(questions[i].id))
                    ); // delete question
                    bologger.log({
                        req: req,
                        user: req.user.realmUserId,
                        action: 'delete',
                        object: 'SurveyQuestions',
                        entity: questions[i].id,
                        info: 'Delete survey question'
                    });
                }
            }
            // add SurveyQuestions and SurveyQuestionOptions
            if (req.body.questions) {
                for (var i in req.body.questions) {
                    var question = yield* addQuestion(req, req.body.questions[i]);
                }
            }
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkSurveyData(req);

            var survey = yield thunkQuery(
                Survey.insert(_.pick(req.body, Survey.table._initialConfig.columns)).returning(Survey.id)
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
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'insert',
                object: 'surveys',
                entity: data.id,
                info: 'Add new survey'
            });
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    questions: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
                .group(SurveyQuestion.id)
            );
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    questionAdd: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield* addQuestion(req, req.body);
        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    questionEdit: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkQuestionData(req, req.body, false);
            var updateObj = _.pick(req.body, SurveyQuestion.editCols);
            if(Object.keys(updateObj).length) {
                yield thunkQuery(
                    SurveyQuestion
                        .update(updateObj)
                        .where(SurveyQuestion.id.equals(req.params.id))
                );
            }
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'update',
                object: 'SurveyQuestions',
                entity: req.params.id,
                info: 'Update survey question'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    questionDelete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                SurveyQuestion.delete().where(SurveyQuestion.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'delete',
                object: 'SurveyQuestions',
                entity: req.params.id,
                info: 'Delete survey question'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });

    }

};

function* addQuestion (req, dataObj) {
    var thunkQuery = req.thunkQuery;
    yield * checkQuestionData(req, dataObj, true);
    var result = yield thunkQuery(
        SurveyQuestion
            .insert(_.pick(dataObj, SurveyQuestion.table._initialConfig.columns))
            .returning(SurveyQuestion.id)
    );
    result = result[0];
    bologger.log({
        req: req,
        user: req.user.realmUserId,
        action: 'insert',
        object: 'SurveyQuestions',
        entity: result.id,
        info: 'Add new survey question'
    });

    if (dataObj.options && dataObj.options.length) {
        var insertArr = [];
        for (var i in dataObj.options) {
            var insertObj = _.pick(dataObj.options[i], SurveyQuestionOption.table._initialConfig.columns);
            insertObj.questionId = result.id;
            insertArr.push(insertObj);
        }

        result.options = yield thunkQuery(
            SurveyQuestionOption.insert(insertArr).returning(SurveyQuestionOption.id)
        );
        bologger.log({
            req: req,
            user: req.user.realmUserId,
            action: 'insert',
            object: 'SurveyQuestionOptions',
            entities: result.options,
            quantity: (result.options) ? result.options.length : 0,
            info: 'Add new survey question options'
        });
    }

    return result;
}

function* checkSurveyData(req) {
    var thunkQuery = req.thunkQuery;
    // if user is superadmin (roleId=1) get projectId from body and check it
    // else get projectId from req.user.projectId

    if (!req.params.id) { // create
        //if (req.user.roleID == 1) { // superadmin
        //    var project = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
        //    if (!_.first(project)) {
        //        throw new HttpError(403, 'Project with id = ' + req.body.projectId + ' does not exists');
        //    }
        //} else {
            req.body.projectId = req.user.projectId;
        //}

        if (!req.body.title) {
            throw new HttpError(403, 'title field are required');
        }
    }
}

function* checkQuestionData(req, dataObj, isCreate) {
    var thunkQuery = req.thunkQuery;
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

    var surveyId = isCreate ? req.params.id : question.surveyId;
    dataObj = _.extend(dataObj, {surveyId: surveyId});

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

    if (isCreate || typeof dataObj.position !== 'undefined') {
        dataObj.position = isNaN(parseInt(dataObj.position)) ? 0 : parseInt(dataObj.position);

        if (dataObj.position > nextPos || dataObj.position < 1) {
            dataObj.position = isCreate ? nextPos : (nextPos-1);
        }

        if ((isCreate && _.first(maxPos))) {
            yield thunkQuery( // CREATE
                'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                'WHERE (' +
                '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                'AND ("SurveyQuestions"."position" >= ' + dataObj.position + ')' +
                ')'
            );
        }
        if (!isCreate && (question.position != dataObj.position)) { // EDIT
            if (question.position < dataObj.position) {
                var q =
                    'UPDATE "SurveyQuestions" SET "position" = "position"-1 ' +
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

