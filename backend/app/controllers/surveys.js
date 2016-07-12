var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Survey = require('app/models/surveys'),
    Policy = require('app/models/policies'),
    Product = require('app/models/products'),
    AttachmentLink = require('app/models/attachment_links'),
    Essence = require('app/models/essences'),
    User = require('app/models/users'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    mammoth = require('mammoth'),
    cheerio = require('cheerio'),
    sSurvey = require('app/services/surveys'),
    sPolicy = require('app/services/policies'),
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_surveys');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        oSurvey.getList().then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    selectOne: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        var oPolicy = new sPolicy(req);
        co(function* () {
            var item = yield oSurvey.getById(req.params.id);
            if (!item) {
                throw new HttpError(404, 'Not found');
            } else {
                if (req.query.forEdit) {
                    if (!item.policyId) {
                        throw new HttpError(403, '"forEdit" query parameter available only for policies');
                    }
                    item.locked = true;
                    if (!item.editor) {
                        yield oPolicy.setEditor(item.policyId, req.user.id);
                        item.editor = req.user.id;
                        item.locked = false;
                    } else if (item.editor == req.user.id) {
                        item.locked = false;
                    }
                }
                return item;
            }
        }).then(function (item) {
            res.json(item);
        }, function (err) {
            next(err);
        });
    },

    parsePolicyDocx: function (req, res, next) {
        if (req.files.file) {
            var file = req.files.file;
            mammoth
                .convertToHtml({
                    path: file.path
                })
                .then(function (result) {

                    if (result.messages.length) { // TODO handle errors
                        //throw new HttpError(403, 'File convert error: ' + JSON.stringify(result.messages))
                        //next();
                    }

                    var html = '<html>' + result.value + '</html>';
                    var $ = cheerio.load(html);
                    var obj = {};

                    var endOfDoc = 'END';

                    $('html').children().each(function(key, item) {
                        if (item.name === 'h1') {
                            var index = $(item).text().replace(new RegExp('[^a-zA-Z]', 'g'), '').toUpperCase();
                            var current = item;
                            debug('Item: '+$(item).html());
                            var content = '';

                            if (index === endOfDoc) {
                                return false;
                            } else {
                                while ($(current).next() && ['h1'].indexOf($(current).next()[0].name) === -1) {
                                    var nextItem = $(current).next()[0];
                                    content += $(nextItem).html();
                                    current = nextItem;
                                }
                            }

                            obj[index] = content;
                        }
                    });
                    res.json(obj);
                })
                .done();

        } else {
            next(new HttpError(403, 'Please, provide a file'));
        }
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

            var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));

            yield thunkQuery(Survey.delete().where(Survey.id.equals(req.params.id)));

            if (survey[0] && survey[0].policyId) {
                yield thunkQuery(Policy.delete().where(Policy.id.equals(survey[0].policyId)));
            }
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
        var oSurvey = new sSurvey(req);
        var oPolicy = new sPolicy(req);
        co(function* () {
            yield * checkSurveyData(req);
            var isUpdated = yield oSurvey.updateOne(req.params.id, req.body);
            if (isUpdated) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'surveys',
                    entity: req.params.id,
                    info: 'Update survey'
                });
            }

            if (req.body.policyId) {
                var isPolicyUpdated = yield oPolicy.updateOne(req.body.policyId, req.body);
                if (isPolicyUpdated) {
                    if (Array.isArray(req.body.attachments)) {
                        yield * linkAttachments(req, req.body.policyId, req.body.attachments);
                    }

                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'policies',
                        entity: req.body.policyId,
                        info: 'Update policy'
                    });
                }
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
                            if (updateSurvey.questions[i].options[optionIndex] !== null) {
                                options.push(updateSurvey.questions[i].options[optionIndex]);
                                options[options.length - 1].questionId = updateSurvey.questions[i].id;
                            }
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

            if (req.body.isPolicy) {
                yield * checkPolicyData(req);

                var policy = yield thunkQuery(
                    Policy
                    .insert(_.pick(req.body, Policy.table._initialConfig.columns))
                    .returning(Policy.id)
                );
                req.body.policyId = policy[0].id;

                if (Array.isArray(req.body.attachments)) {
                    yield * linkAttachments(req, policy[0].id, req.body.attachments);
                }

            }

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

    if (!req.params.id) { // create
        req.body.projectId = req.user.projectId;

        if (!req.body.title) {
            throw new HttpError(403, 'title field are required');
        }
    }
}

function* checkPolicyData(req) {
    var thunkQuery = thunkify(new Query(req.params.realm));

    if (!req.body.section || !req.body.subsection) {
        throw new HttpError(403, 'section and subsection fields are required');
    }

    req.body.author = req.user.realmUserId;
}

function* linkAttachments(req, policyId, attachArr) {
    var thunkQuery = req.thunkQuery;

    var essence = yield thunkQuery(Essence.select().where(Essence.tableName.equals('Policies')));

    if (Array.isArray(attachArr)) {

        var link = yield thunkQuery(AttachmentLink.select().where({
            essenceId: essence[0].id,
            entityId: policyId
        }));

        if (link.length) {
            yield thunkQuery(
                AttachmentLink
                .update({
                    attachments: attachArr
                })
                .where({
                    essenceId: essence[0].id,
                    entityId: policyId
                })
            );
        } else {
            yield thunkQuery(
                AttachmentLink.insert({
                    essenceId: essence[0].id,
                    entityId: policyId,
                    attachments: attachArr
                })
            );
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
