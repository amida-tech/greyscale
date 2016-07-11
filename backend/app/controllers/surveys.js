var
    _ = require('underscore'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Survey = require('../models/surveys'),
    Product = require('../models/products'),
    Project = require('../models/projects'),
    SurveyQuestion = require('../models/survey_questions'),
    SurveyQuestionOption = require('../models/survey_question_options'),
    co = require('co'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_surveys');
debug.log = console.log.bind(console);

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
                    '( ' +
                    'SELECT ' +
                    '"SurveyQuestions".* , ' +
                    'array_agg(row_to_json("SurveyQuestionOptions".*)) as options ' +
                    'FROM ' +
                    '"SurveyQuestions" ' +
                    'LEFT JOIN ' +
                    '"SurveyQuestionOptions" ' +
                    'ON ' +
                    '"SurveyQuestions"."id" = "SurveyQuestionOptions"."questionId" ' +
                    'WHERE "SurveyQuestions"."surveyId" = "Surveys"."id" ' +
                    'GROUP BY "SurveyQuestions"."id" ' +
                    'ORDER BY ' +
                    '"SurveyQuestions"."position" ' +
                    ') ' +
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
                        user: req.user,
                        action: 'delete',
                        object: 'SurveyQuestionOptions',
                        entities: {
                            questionId: questions[i].id
                        },
                        quantity: 1,
                        info: 'Delete survey question options for question ' + questions[i].id
                    });

                    yield thunkQuery(
                        SurveyQuestion.delete().where(SurveyQuestion.id.equals(questions[i].id))
                    ); // delete question
                    bologger.log({
                        req: req,
                        user: req.user,
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
                user: req.user,
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
            var updateSurvey = req.body;
            updateSurvey = _.pick(updateSurvey, Survey.editCols);

            if (Object.keys(updateSurvey).length) {
                yield thunkQuery(
                    Survey
                    .update(updateSurvey)
                    .where(Survey.id.equals(req.params.id))
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'surveys',
                    entity: req.params.id,
                    info: 'Update survey'
                });
            }

            var passedIds = [];
            var updatedIds = [];
            var insertIds = [];

            updateSurvey = req.body;
            var dbQuestions = yield thunkQuery(
                SurveyQuestion.select().where(SurveyQuestion.surveyId.equals(req.params.id))
            );
            var relIds = dbQuestions.map(function (value) {
                return value.id;
            });

            var statusOverall = 202;
            var errorMessages = [];

            for (var i in updateSurvey.questions) {
                if (!updateSurvey.questions[i].deleted) { // if not deleted
                    var updateObj = _.pick(updateSurvey.questions[i], SurveyQuestion.editCols);
                    if (updateSurvey.questions[i].id) { // need update
                        passedIds.push(updateSurvey.questions[i].id);
                        if (Object.keys(updateObj).length && relIds.indexOf(updateSurvey.questions[i].id) !== -1 && !updateSurvey.questions[i].deleted) { // have data to update,  exists and not deleted

                            try {
                                yield thunkQuery(
                                    SurveyQuestion
                                    .update(updateObj)
                                    .where(SurveyQuestion.id.equals(updateSurvey.questions[i].id))
                                );
                                updateSurvey.questions[i].status = 'Ok';
                                updateSurvey.questions[i].message = 'Updated';
                                updateSurvey.questions[i].statusCode = 200;
                            } catch (err) {
                                updateSurvey.questions[i].status = 'Fail';
                                if (err instanceof HttpError) {
                                    updateSurvey.questions[i].message = err.message.message;
                                    updateSurvey.questions[i].statusCode = err.status;
                                    errorMessages.push(err.message.message);
                                } else {
                                    updateSurvey.questions[i].message = err.message;
                                    updateSurvey.questions[i].statusCode = 500;
                                }
                                errorMessages.push({
                                    questionId: updateSurvey.questions[i].id,
                                    action: 'update question',
                                    message: updateSurvey.questions[i].message,
                                    code: updateSurvey.questions[i].statusCode
                                });
                                debug('=== error ===');
                                debug(err);
                            }
                            statusOverall = (updateSurvey.questions[i].status === 'Ok') ? statusOverall : 400;

                            updatedIds.push(updateSurvey.questions[i].id);
                            if (updateSurvey.questions[i].status === 'Ok') {
                                bologger.log({
                                    req: req,
                                    user: req.user,
                                    action: 'update',
                                    object: 'SurveyQuestions',
                                    entity: updateSurvey.questions[i].id,
                                    info: 'Update survey question'
                                });
                            }
                            var deletedQuestionOptions = yield thunkQuery(
                                SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(updateSurvey.questions[i].id)).returning(SurveyQuestionOption.id)
                            );
                            if (deletedQuestionOptions && deletedQuestionOptions.length) {
                                bologger.log({
                                    req: req,
                                    user: req.user,
                                    action: 'delete',
                                    object: 'SurveyQuestionOptions',
                                    entities: deletedQuestionOptions,
                                    quantity: deletedQuestionOptions.length,
                                    info: 'Delete survey question options for question ' + updateSurvey.questions[i].id
                                });
                            }
                        }
                    } else {
                        var insertObj = _.pick(updateSurvey.questions[i], SurveyQuestion.table._initialConfig.columns);
                        insertObj.surveyId = req.params.id;

                        var insertId;
                        try {
                            insertId = yield thunkQuery(SurveyQuestion.insert(insertObj).returning(SurveyQuestion.id));
                            updateSurvey.questions[i].status = 'Ok';
                            updateSurvey.questions[i].message = 'Added';
                            updateSurvey.questions[i].statusCode = 200;
                        } catch (err) {
                            updateSurvey.questions[i].status = 'Fail';
                            if (err instanceof HttpError) {
                                updateSurvey.questions[i].message = err.message.message;
                                updateSurvey.questions[i].statusCode = err.status;
                            } else {
                                updateSurvey.questions[i].message = err.message;
                                updateSurvey.questions[i].statusCode = 500;
                            }
                            errorMessages.push({
                                questionId: null,
                                action: 'add question',
                                message: updateSurvey.questions[i].message,
                                code: updateSurvey.questions[i].statusCode
                            });
                            debug('=== error ===');
                            debug(err);
                        }
                        statusOverall = (updateSurvey.questions[i].status === 'Ok') ? statusOverall : 400;

                        insertIds.push(insertId[0].id);
                        updateSurvey.questions[i].id = insertId[0].id;
                        if (updateSurvey.questions[i].status === 'Ok') {
                            bologger.log({
                                req: req,
                                user: req.user,
                                action: 'insert',
                                object: 'SurveyQuestions',
                                entity: updateSurvey.questions[i].id,
                                info: 'Insert survey question'
                            });
                        }
                    }
                    if (updateSurvey.questions[i].options && updateSurvey.questions[i].options.length && updateSurvey.questions[i].options[0]) {
                        var options = [];
                        for (var optionIndex in updateSurvey.questions[i].options) {
                            options.push(updateSurvey.questions[i].options[optionIndex]);
                            options[options.length - 1].questionId = updateSurvey.questions[i].id;
                        }
                        try {
                            yield thunkQuery(SurveyQuestionOption.insert(options));
                            updateSurvey.questions[i].statusOptions = 'Ok';
                            updateSurvey.questions[i].messageOptions = 'Added';
                            updateSurvey.questions[i].statusCodeOptions = 200;
                        } catch (err) {
                            updateSurvey.questions[i].statusOptions = 'Fail';
                            if (err instanceof HttpError) {
                                updateSurvey.questions[i].messageOptions = err.message.message;
                                updateSurvey.questions[i].statusCodeOptions = err.status;
                            } else {
                                updateSurvey.questions[i].messageOptions = err.message;
                                updateSurvey.questions[i].statusCodeOptions = 500;
                            }
                            errorMessages.push({
                                questionId: updateSurvey.questions[i].id,
                                action: 'add question options',
                                message: updateSurvey.questions[i].message,
                                code: updateSurvey.questions[i].statusCode
                            });
                            debug('=== error ===');
                            debug(err);
                        }
                        statusOverall = (updateSurvey.questions[i].statusOptions === 'Ok') ? statusOverall : 400;
                        if (updateSurvey.questions[i].statusOptions === 'Ok') {
                            bologger.log({
                                req: req,
                                user: req.user,
                                action: 'insert',
                                object: 'SurveyQuestionOptions',
                                entities: updateSurvey.questions[i].options,
                                quantity: updateSurvey.questions[i].options.length,
                                info: 'Insert survey question options'
                            });
                        }
                    }
                } else { // delete question
                    try {
                        yield thunkQuery(SurveyQuestionOption.delete().where(SurveyQuestionOption.questionId.equals(updateSurvey.questions[i].id)));
                        yield thunkQuery(SurveyQuestion.delete().where(SurveyQuestion.id.equals(updateSurvey.questions[i].id)));
                        updateSurvey.questions[i].status = 'Ok';
                        updateSurvey.questions[i].message = 'Deleted';
                        updateSurvey.questions[i].statusCode = 200;
                    } catch (err) {
                        updateSurvey.questions[i].status = 'Fail';
                        if (err instanceof HttpError) {
                            updateSurvey.questions[i].message = err.message.message;
                            updateSurvey.questions[i].statusCode = err.status;
                        } else {
                            updateSurvey.questions[i].message = err.message;
                            updateSurvey.questions[i].statusCode = 500;
                        }
                        errorMessages.push({
                            questionId: updateSurvey.questions[i].id,
                            action: 'delete question',
                            message: updateSurvey.questions[i].message,
                            code: updateSurvey.questions[i].statusCode
                        });
                        debug('=== error ===');
                        debug(err);
                    }
                    statusOverall = (updateSurvey.questions[i].status === 'Ok') ? statusOverall : 400;
                    if (updateSurvey.questions[i].status === 'Ok') {
                        bologger.log({
                            req: req,
                            user: req.user,
                            action: 'delete',
                            object: 'SurveyQuestions',
                            entity: updateSurvey.questions[i].id,
                            info: 'Delete survey question'
                        });
                    }
                }
            }

            return {
                status: statusOverall,
                errors: errorMessages,
                questions: updateSurvey.questions
            };

        }).then(function (data) {
            res.status(data.status).json(data);
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
                    var question = yield * addQuestion(req, req.body.questions[i]);
                    survey.questions.push(question);
                }
            }

            return survey;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
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
                .group(SurveyQuestion.id),
                _.omit(req.query, 'offset', 'limit')
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
            return yield * addQuestion(req, req.body);
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
            if (Object.keys(updateObj).length) {
                yield thunkQuery(
                    SurveyQuestion
                    .update(updateObj)
                    .where(SurveyQuestion.id.equals(req.params.id))
                );
            }
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
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

        co(function* () {
            return yield thunkQuery(
                SurveyQuestion.delete().where(SurveyQuestion.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'SurveyQuestions',
                entity: req.params.id,
                info: 'Delete survey question'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    }

};

function* addQuestion(req, dataObj) {
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
        user: req.user,
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
            user: req.user,
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
    var question;
    if (isCreate) {
        if (
            typeof dataObj.label === 'undefined' ||
            typeof dataObj.type === 'undefined'
        ) {
            throw new HttpError(403, 'label, surveyId(in params) and type fields are required');
        }
    } else {
        question = yield thunkQuery(
            SurveyQuestion.select().where(SurveyQuestion.id.equals(req.params.id))
        );
        if (!_.first(question)) {
            throw new HttpError(403, 'Survey question with id = ' + req.params.id + 'does not exist');
        }
        question = _.first(question);
    }

    var surveyId = isCreate ? req.params.id : question.surveyId;
    dataObj = _.extend(dataObj, {
        surveyId: surveyId
    });

    if (dataObj.type) {
        if (!(parseInt(dataObj.type) in SurveyQuestion.types)) {
            throw new HttpError(
                403,
                'Type value should be from 0 till ' + Object.keys(SurveyQuestion.types).length - 1
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
            dataObj.position = isCreate ? nextPos : (nextPos - 1);
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
        if (!isCreate && (question.position !== dataObj.position)) { // EDIT
            var q;
            if (question.position < dataObj.position) {
                q =
                    'UPDATE "SurveyQuestions" SET "position" = "position"-1 ' +
                    'WHERE (' +
                    '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                    'AND ("SurveyQuestions"."position" > ' + question.position + ')' +
                    'AND ("SurveyQuestions"."position" <= ' + dataObj.position + ')' +
                    ')';
            } else {
                q =
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
