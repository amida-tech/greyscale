var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Survey = require('app/models/surveys'),
    SurveyMeta = require('app/models/survey_meta'),
    Policy = require('app/models/policies'),
    Product = require('app/models/products'),
    AttachmentLink = require('app/models/attachment_links'),
    Essence = require('app/models/essences'),
    User = require('app/models/users'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    mc = require('app/mc_helper'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    mammoth = require('mammoth-colors'),
    cheerio = require('cheerio'),
    sSurvey = require('app/services/surveys'),
    sPolicy = require('app/services/policies'),
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_surveys');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        oSurvey.getList(req.query).then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    surveyVersions: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        oSurvey.getVersions(req.params.id).then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    surveyVersion: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        oSurvey.getVersion(req.params.id, req.params.version).then(
            (data) => {
                if (data) {
                    res.json(data);
                } else {
                    next(new HttpError(404, 'Version does not exist'));
                }
            },
            (err) => next(err)
        );
    },

    parsePolicyDocx: function (req, res, next) {
        if (req.files.file) {
            var file = req.files.file;
            var options = {
                styleMap: [
                    "u  => u"
                ]
            };
            mammoth
                .convertToHtml(
                    {path: file.path},
                    options
                )
                .then(function (result) {

                    var obj = {headers: {}, sections: {}};
                    if (result.messages.length) {
                        obj.errors = result.messages;
                    }

                    var html = '<html>' + result.value + '</html>';
                    var $ = cheerio.load(html);

                    var endOfDoc = 'END';

                    var tables = $('html').find('table');

                    if (tables[0]) {
                        $(tables[0]).find('tr').each(function(key, item){
                            var tds = $(item).children('td');
                            obj.headers[$(tds[0]).text()] = $(tds[1]).text();
                        });
                    }

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
                            content = content.split('\t').join('&nbsp;&nbsp;&nbsp;&nbsp;');
                            obj.sections[index] = content;
                        }
                    });

                    res.json(obj);
                })
                .done();

        } else {
            next(new HttpError(403, 'Please, provide a file'));
        }
    },

    policyToDocx: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            //var productId;
            //try {
            //    productId = yield mc.get(req.mcClient, req.params.ticket);
            //} catch (e) {
            //    throw new HttpError(500, e);
            //}
            //
            //if (!productId) {
            //    throw new HttpError(400, 'Ticket is not valid');
            //}

            var oSurvey = new sSurvey(req);
            var docx = yield oSurvey.policyToDocx(req.params.id, req.params.version);

            return {
                docx: docx
            };

        }).then(function (data) {
            res.writeHead ( 200, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-disposition': 'attachment; filename=' + req.params.id + '.docx'
            });

            //data.docx.pipe ( res );
            res.end(data.docx);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        var data = false;
        co(function* () {
            if (req.query.forEdit) {
                if (req.user.roleID !== 2) {
                    throw new HttpError(403, 'Only admins can edit surveys');
                }

                data = yield oSurvey.getVersion(req.params.id, -1); // draft
                if (data) return data;
            }

            data = yield oSurvey.getById(req.params.id); // max version

            if (data) {
                return data;
            } else {
                throw new HttpError(404, 'Not found');
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var products = yield thunkQuery(
                SurveyMeta
                    .select()
                    .where(SurveyMeta.surveyId.equals(req.params.id))
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

            //var survey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.params.id)));

            yield thunkQuery(Policy.delete().where(Policy.surveyId.equals(req.params.id)));
            yield thunkQuery(Survey.delete().where(Survey.id.equals(req.params.id)));

/*
            if (survey[0] && survey[0].policyId) {
                yield thunkQuery(Policy.delete().where(Policy.id.equals(survey[0].policyId)));
            }
*/
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
        var oSurvey = new sSurvey(req);

        co(function* () {
            if (req.query.draft) {
                return yield oSurvey.saveDraft(req.params.id, req.body);
            } else {
                return yield oSurvey.createVersion(req.params.id, req.body);
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    editOld: function (req, res, next) {
        co (function* () {
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

            if (req.body.policyId !== null) {
                var updatePolicy = _.pick(req.body, Policy.editCols);

                if (Object.keys(updatePolicy).length) {
                    yield thunkQuery(
                        Policy
                            .update(updatePolicy)
                            .where(Policy.id.equals(req.body.policyId))
                    );

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
        });
    },

    insertOne: function (req, res, next) {
        var oSurvey = new sSurvey(req);
        oSurvey.createVersion(null, req.body).then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    insertOneOld: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkSurveyData(req);
            req.body = _.omit(req.body, 'id'); // remove id from body

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
