var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyMeta = require('app/models/survey_meta'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    sAttachment = require('app/services/attachments'),
    sEssence = require('app/services/essences'),
    sUser = require('app/services/users'),
    Task = require('app/models/tasks'),
    Product = require('app/models/products'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    htmlDocx = require('html-docx-js'),
    HttpError = require('app/error').HttpError;

var debug = require('debug')('debug_service_surveys');
debug.log = console.log.bind(console);

var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }

    this._lockLimit = 1*60*1000; //one minute

    this.getList = function (options) {
        return co(function* () {
            return yield thunkQuery(
                'SELECT ' +
                '    "Surveys".*, ' +
                '    "Policies"."id" AS "policyId", ' +
                '    "Policies"."section", ' +
                '    "Policies"."subsection", ' +
                '    "Policies"."author", ' +
                '    "Policies"."number", ' +
                '    "SurveyMeta"."productId", ' +
                '    ARRAY (SELECT "UOAid" FROM "ProductUOA" WHERE "productId" = "SurveyMeta"."productId") as uoas, ' +
                '    (SELECT array_agg(row_to_json(att)) ' +
                '       FROM ( ' +
                '           SELECT a."id", a."filename", a."size", a."mimetype" ' +
                '           FROM "AttachmentLinks" al ' +
                '           JOIN "Attachments" a ' +
                '           ON al."entityId" = "Surveys"."id" ' +
                '           AND al."version" = "Surveys"."surveyVersion" ' +
                '           JOIN "Essences" e ' +
                '           ON e.id = al."essenceId" ' +
                '           AND e."tableName" = \'Surveys\' ' +
                '           WHERE a."id" = ANY(al."attachments") ' +
                '       ) as att' +
                '   ) as attachments ' +
                'FROM ' +
                '( ' +
                '    SELECT a.id, max(a."surveyVersion") as version ' +
                'FROM "Surveys" a ' +
                'GROUP BY a."id" ' +
                ') as maxv ' +
                'LEFT JOIN "Surveys" ' +
                'ON (maxv.id = "Surveys".id AND maxv.version = "Surveys"."surveyVersion") ' +
                'LEFT JOIN "SurveyMeta" ' +
                'ON ("SurveyMeta"."surveyId" = "Surveys"."id") ' +
                'LEFT JOIN "Policies" ' +
                'ON ("Surveys"."id" = "Policies"."surveyId")' +
                'AND ("Surveys"."surveyVersion" = "Policies"."surveyVersion")'
            );
        });
    };

    this.getVersions = function (surveyId) {
        return co(function* () {
           return yield thunkQuery(
               Survey
               .select(Survey.star(),SurveyMeta.productId)
               .from(
                   Survey
                   .leftJoin(SurveyMeta)
                   .on(SurveyMeta.surveyId.equals(Survey.id))
               )
               .where(
                   Survey.id.equals(surveyId).and(Survey.surveyVersion.gte(0))
               )
           );
        });
    };

    this.getVersion = function (id, version) {
        return co(function* () {
            var data =  yield thunkQuery(
                Survey
                    .from(
                        Survey
                            .leftJoin(Policy)
                            .on(
                                Survey.id.equals(Policy.surveyId)
                                    .and(Survey.surveyVersion.equals(Policy.surveyVersion))
                            )
                            .leftJoin(SurveyMeta)
                            .on(SurveyMeta.surveyId.equals(Survey.id))
                            .leftJoin(Product)
                            .on(Product.id.equals(SurveyMeta.productId))
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
                        //SurveyMeta.productId,
                        'row_to_json("Products".*) as product',
                        'ARRAY (SELECT "UOAid" FROM "ProductUOA" WHERE "productId" = "SurveyMeta"."productId") as uoas, ' +
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
                            'AND "SurveyQuestions"."surveyVersion" = "SurveyQuestionOptions"."surveyVersion" ' +
                            'WHERE "SurveyQuestions"."surveyId" = "Surveys"."id" ' +
                            'AND "SurveyQuestions"."surveyVersion" = "Surveys"."surveyVersion" ' +
                            'GROUP BY "SurveyQuestions"."id", "SurveyQuestions"."surveyVersion" ' +
                            'ORDER BY ' +
                            '"SurveyQuestions"."position" ' +
                        ') ' +
                        'SELECT array_agg(row_to_json(sq.*)) as questions FROM sq)',
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                            'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                            'FROM "AttachmentLinks" al ' +
                            'JOIN "Attachments" a ' +
                            'ON al."entityId" = "Surveys"."id" ' +
                            'AND al."version" = "Surveys"."surveyVersion" ' +
                            'JOIN "Essences" e ' +
                            'ON e.id = al."essenceId" ' +
                            'AND e."tableName" = \'Surveys\' ' +
                            'WHERE a."id" = ANY(al."attachments")' +
                        ') as att) as attachments'
                    )
                    .where(Survey.id.equals(id).and(Survey.surveyVersion.equals(version)))
                    .group(Survey.id, Survey.surveyVersion, Policy.id, SurveyMeta.productId, Product.id)
            );
            return data[0] || false;
        });
    };

    this.getSurveyAssignedToProduct = function (productId) {
        var self = this;
        return co(function*() {
            var survey = yield thunkQuery(SurveyMeta.select().where(SurveyMeta.productId.equals(productId)));
            return _.first(survey) ? survey[0].surveyId : null;
        });
    };

    this.getMeta = function (id) {
        return co(function* () {
            var surveyMeta = yield thunkQuery(SurveyMeta.select().where(SurveyMeta.surveyId.equals(id)));
            return surveyMeta[0] || false;
        });
    };

    this.unlockSocketSurveys = function (socketId) { // in theory, we can have just one locked policy per connection
        return co(function* () {
            var editFields = {
                socketId: null,
                editor: null,
                startEdit: null
            };
            return yield thunkQuery(SurveyMeta.update(editFields).where(SurveyMeta.socketId.equals(socketId)).returning(SurveyMeta.star()));
        });
    };

    this.lockSurvey = function (id, userId, socketId) {
        var self = this;
        return co(function* () {
            var oUser = new sUser(req);
            var startEdit = new Date();
            var fields = {
                editor: userId,
                startEdit: startEdit,
                socketId: socketId
            };

            var user = yield oUser.getById(userId);

            if (!user) {
                throw new HttpError(403, "User with id = " + userId + " does not exist");
            } else if (user.roleID != 2) {
                throw new HttpError(403, "Only admins can edit a policy");
            }

            var surveyMeta = yield self.getMeta(id);

            if (surveyMeta) {
                if (surveyMeta.socketId && (surveyMeta.socketId !== socketId)) {
                    var startEditOld = new Date(surveyMeta.startEdit);
                    var range = startEdit.getTime() - startEditOld.getTime();
                    if ((range < self._lockLimit) && (surveyMeta.editor !== userId)) {
                        throw new HttpError(403, "Policy already locked");
                    }
                }

                surveyMeta = yield thunkQuery(
                    SurveyMeta.update(fields).where(SurveyMeta.surveyId.equals(id)).returning(SurveyMeta.star())
                );
            } else {
                fields.surveyId = id;
                surveyMeta = yield thunkQuery(
                    SurveyMeta.insert(fields).returning(SurveyMeta.star())
                );
            }

            return surveyMeta[0];

        });
    };

    this.assignToProduct = function (surveyId, productId) {
        var self = this;
        return co(function*() {
            var meta = yield thunkQuery(SurveyMeta.select().where(SurveyMeta.surveyId.equals(surveyId)));

            if (meta.length) {
                yield thunkQuery(
                    SurveyMeta.update({productId: productId}).where({surveyId: surveyId}).returning(SurveyMeta.star())
                );
            } else {
                yield thunkQuery(
                    SurveyMeta.insert({surveyId: surveyId, productId: productId}).returning(SurveyMeta.star())
                );
            }
        });
    };

    this.detachFromProduct = function (productId) {
        var self = this;
        return co(function*() {
            yield thunkQuery(SurveyMeta.delete().where(SurveyMeta.productId.equals(productId)));
        });
    };

    this.createVersion = function (surveyId, fullSurveyData) {
        var self = this;
        return co(function* () {

            var surveyData = _.pick(fullSurveyData, Survey.insertCols);
            var policyData = _.pick(fullSurveyData, Policy.insertCols);
            surveyData.creator = req.user.realmUserId;
            policyData.author = req.user.realmUserId;
            // check survey/policy data

            surveyData.id = surveyId;
            yield self.checkSurveyData(fullSurveyData);

            if (fullSurveyData.isPolicy) {
                yield self.checkPolicyData(policyData);
            }

            delete surveyData.surveyVersion;

            var surveyVersion = yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));

            if (!surveyId) {
                surveyId = surveyVersion[0].id;
            }

            if (fullSurveyData.isPolicy) {
                policyData.surveyVersion = surveyVersion[0].surveyVersion;
                policyData.surveyId = surveyId;
                yield thunkQuery(Policy.insert(policyData).returning(Policy.star()));
            }

            if (Array.isArray(fullSurveyData.questions) && fullSurveyData.questions.length) {
                for (var i in fullSurveyData.questions) {
                    yield self.addVersionQuestion(surveyId, surveyVersion[0].surveyVersion, fullSurveyData.questions[i]);
                }
            }

            if (Array.isArray(fullSurveyData.attachments) && fullSurveyData.attachments.length) {
                yield self.linkAttachments(surveyId, surveyVersion[0].surveyVersion, fullSurveyData.attachments);
            }

            yield self.deleteDraft(surveyId);

            return surveyVersion;
        });
    };

    this.deleteDraft = function (surveyId) {
        var self = this;
        var oAttachment = new sAttachment(req);
        var oEssence = new sEssence(req);
        return co(function* (){

            var questions = yield thunkQuery(
                SurveyQuestion.select().where({surveyId: surveyId, surveyVersion: -1})
            );

            if (questions.length) {
                for (var i in questions) {
                    yield self.deleteVersionQuestion(questions[i].id, -1);
                }
            }

            yield thunkQuery(
                Policy.delete().where(
                    Policy.surveyId.equals(surveyId)
                    .and(Policy.surveyVersion.equals(-1))
                )
            );

            yield thunkQuery(
                Survey.delete().where(
                    Survey.id.equals(surveyId)
                    .and(Survey.surveyVersion.equals(-1))
                )
            );

            var essence = yield oEssence.getByTableName('Surveys');
            yield oAttachment.removeLink(essence.id, surveyId, -1);
        });
    };

    this.updateDraft = function (surveyId, fullSurveyData) {
        var self = this;
        return co(function* () {
            var surveyData = _.pick(fullSurveyData, Survey.editCols);
            var policyData = _.pick(fullSurveyData, Policy.editCols);

            var surveyDraft = yield thunkQuery(
                Survey.update(surveyData)
                .where(
                    Survey.id.equals(surveyId)
                    .and(Survey.surveyVersion.equals(-1))
                )
                .returning(Survey.star())
            );

            if (fullSurveyData.isPolicy) {
                var policyDraft = yield thunkQuery(
                    Policy.update(policyData)
                    .where(
                        Policy.surveyId.equals(surveyId)
                        .and(Policy.surveyVersion.equals(-1))
                    )
                    .returning(Policy.star())
                );
            }

            if (Array.isArray(fullSurveyData.questions) && fullSurveyData.questions.length){
                var oldQuestions = yield thunkQuery(
                    SurveyQuestion.select().where({surveyId: surveyId, surveyVersion: -1})
                );
                var oldQuestionsIds = {};

                for (var i in oldQuestions) {
                    oldQuestionsIds[oldQuestions[i].id] = oldQuestions[i];
                }

                for (var i in fullSurveyData.questions) {
                    var questionData = fullSurveyData.questions[i];
                    if (questionData.id && oldQuestionsIds[questionData.id]) { // need update or delete
                        if (questionData.deleted) {
                            yield self.deleteVersionQuestion(questionData.id, -1);
                        } else {
                            yield self.updateVersionQuestion(surveyId, -1, questionData.id, questionData);
                        }
                    } else { // new question, insert
                        yield self.addVersionQuestion(surveyId, -1, questionData);
                    }
                }
            }

            if (Array.isArray(fullSurveyData.attachments) && fullSurveyData.attachments.length) {
                yield self.linkAttachments(surveyId, -1, fullSurveyData.attachments);
            }

            return surveyDraft;
        });
    };

    this.addVersionQuestion = function (surveyId, surveyVersion, fullQuestionData) {
        var self = this;
        return co(function* () {
            var questionData = _.pick(fullQuestionData, SurveyQuestion.insertCols);
            questionData.surveyId = surveyId;
            questionData.surveyVersion = surveyVersion;
            var questionId = (yield thunkQuery(SurveyQuestion.insert(questionData).returning(SurveyQuestion.id)))[0].id;
            if (Array.isArray(fullQuestionData.options) && fullQuestionData.options.length) {
                for (var i in fullQuestionData.options) {
                    yield self.addVersionQuestionOption(questionId, surveyVersion, fullQuestionData.options[i]);
                }
            }
        });
    };

    this.addVersionQuestionOption = function (questionId, surveyVersion, optionData) {
        return co(function*() {
            var data = _.pick(optionData, SurveyQuestionOption.insertCols);
            data.questionId = questionId;
            data.surveyVersion = surveyVersion;
            return yield thunkQuery(SurveyQuestionOption.insert(data).returning(SurveyQuestionOption.id));
        });
    };

    this.deleteVersionQuestionOptions = function (questionId, surveyVersion) {
        return co(function* (){
            yield thunkQuery(
                SurveyQuestionOption.delete().where({questionId: questionId, surveyVersion: surveyVersion})
            );
        });
    };

    // Actualy, we can update only questions in draft (version = -1)
    this.updateVersionQuestion = function (surveyId, surveyVersion, questionId, fullQuestionData) {
        var self = this;
        return co(function* () {
            var questionData = _.pick(fullQuestionData, SurveyQuestion.editCols);
            questionData.surveyId = surveyId;
            questionData.surveyVersion = surveyVersion;
            if (Object.keys(questionData).length) {
                yield thunkQuery(
                    SurveyQuestion.update(questionData).where({id: questionId, surveyVersion: surveyVersion})
                );
            }

            yield self.deleteVersionQuestionOptions(questionId, surveyVersion);

            if (Array.isArray(fullQuestionData.options) && fullQuestionData.options.length) {
                for (var i in fullQuestionData.options) {
                    yield self.addVersionQuestionOption(questionId, surveyVersion, fullQuestionData.options[i]);
                }
            }
        });
    };

    this.deleteVersionQuestion = function (questionId, surveyVersion) {
        return co(function* (){
            yield thunkQuery(
                SurveyQuestionOption.delete()
                    .where(
                        SurveyQuestionOption.questionId.equals(questionId)
                            .and(SurveyQuestionOption.surveyVersion.equals(surveyVersion))
                    )
            );
            yield thunkQuery(
                SurveyQuestion.delete()
                    .where(
                        SurveyQuestion.id.equals(questionId)
                            .and(SurveyQuestion.surveyVersion.equals(surveyVersion))
                    )
            );
        });
    };

    this.createDraft = function (surveyId, fullSurveyData) {
        var self = this;
        return co(function* () {

            var surveyData = _.pick(fullSurveyData, Survey.insertCols);
            var policyData = _.pick(fullSurveyData, Policy.insertCols);
            surveyData.surveyVersion = -1;
            policyData.surveyVersion = -1;
            surveyData.creator = req.user.realmUserId;
            policyData.author = req.user.realmUserId;
            // check survey/policy data

            surveyData.id = surveyId;
            yield self.checkSurveyData(fullSurveyData);

            if (fullSurveyData.isPolicy) {
                yield self.checkPolicyData(policyData);
            }

            yield thunkQuery(Survey.delete().where({id: surveyId, surveyVersion: -1}));
            var surveyDraft = yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));

            if (fullSurveyData.isPolicy) {
                policyData.surveyId = surveyId;
                // what if by some reason policy draft already exists
                yield thunkQuery(Policy.delete().where({surveyId: surveyId, surveyVersion: -1}));
                var policyDraft = yield thunkQuery(Policy.insert(policyData).returning(Policy.star()));
            }

            if (Array.isArray(fullSurveyData.questions) && fullSurveyData.questions.length) {
                for (var i in fullSurveyData.questions) {
                    yield self.addVersionQuestion(surveyId, -1, fullSurveyData.questions[i]);
                }
            }

            if (Array.isArray(fullSurveyData.attachments) && fullSurveyData.attachments.length) {
                yield self.linkAttachments(surveyId, -1, fullSurveyData.attachments);
            }

            return surveyDraft;
        });
    };

    this.linkAttachments = function (surveyId, version, attachArr) {
        var oAttachment = new sAttachment(req);
        var oEssence = new sEssence(req);

        return co(function* () {
            var essence = yield oEssence.getByTableName('Surveys');
            if (Array.isArray(attachArr)) {
                var link = yield oAttachment.getLink(essence.id, surveyId, version);

                if (link.length) {
                    yield oAttachment.updateLinkArray(essence.id, surveyId, attachArr, version);
                } else {
                    var link = {
                        essenceId: essence.id,
                        entityId: surveyId,
                        version: version,
                        attachments: attachArr
                    }
                    yield oAttachment.addLink(link);
                }
            }
        });
    };

    this.saveDraft = function (surveyId, fullSurveyData) {
        var self = this;
        return co(function* () {
            var draft = yield self.getVersion(surveyId, -1);
            if (!draft) {
                draft = self.createDraft(surveyId, fullSurveyData);
            } else {
                draft = self.updateDraft(surveyId, fullSurveyData);
            }
            return draft;
        });
    };

    this.checkSurveyData = function (surveyData) {
        return co(function* () {
            if (!surveyData.id) { // create
                if (!req.body.title) {
                    throw new HttpError(403, 'title field is required');
                }
            }
        });
    };

    this.checkPolicyData = function (policyData) {
        return co(function* () {
            if (!policyData.id) {
                if (!req.body.section || !req.body.subsection) {
                    throw new HttpError(403, 'section and subsection fields are required');
                }
            }
        });
    };

    this.getById = function (id) {
        return co(function* () {
            var data =  yield thunkQuery(
                Survey
                    .from(
                        Survey
                        .leftJoin(Policy)
                        .on(
                            Survey.id.equals(Policy.surveyId)
                            .and(Survey.surveyVersion.equals(Policy.surveyVersion))
                        )
                        .leftJoin(SurveyMeta)
                        .on(SurveyMeta.surveyId.equals(Survey.id))
                        .leftJoin(Product)
                        .on(Product.id.equals(SurveyMeta.productId))
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
                        //SurveyMeta.productId,
                        'row_to_json("Products".*) as product',
                        'ARRAY (SELECT "UOAid" FROM "ProductUOA" WHERE "productId" = "SurveyMeta"."productId") as uoas, ' +
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
                            'AND "SurveyQuestions"."surveyVersion" = "SurveyQuestionOptions"."surveyVersion" ' +
                            'WHERE "SurveyQuestions"."surveyId" = "Surveys"."id" ' +
                            'AND "SurveyQuestions"."surveyVersion" = "Surveys"."surveyVersion" ' +
                            'GROUP BY "SurveyQuestions"."id", "SurveyQuestions"."surveyVersion" ' +
                            'ORDER BY ' +
                            '"SurveyQuestions"."position" ' +
                        ') ' +
                        'SELECT array_agg(row_to_json(sq.*)) as questions FROM sq)',
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                            'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                            'FROM "AttachmentLinks" al ' +
                            'JOIN "Attachments" a ' +
                            'ON al."entityId" = "Policies"."id" ' +
                            'JOIN "Essences" e ' +
                            'ON e.id = al."essenceId" ' +
                            'AND e."tableName" = \'Policies\' ' +
                            'WHERE a."id" = ANY(al."attachments")' +
                        ') as att) as attachments'
                    )
                    .where(
                        Survey.id.equals(id)
                        .and(Survey.surveyVersion.equals(
                            Survey.as('subS')
                            .subQuery()
                            .select(
                                Survey.as('subS').surveyVersion.max()
                            )
                            .where(Survey.as('subS').id.equals(Survey.id))
                        ))
                    )
                    .group(Survey.id, Survey.surveyVersion, Policy.id, SurveyMeta.productId, Product.id)
            );
            return data[0] || false;
        });
    };

    this.updateOne = function (id, oSurvey) {
        return co(function* () {
            oSurvey = _.pick(oSurvey, Survey.editCols);
            if (Object.keys(oSurvey).length) {
                yield thunkQuery(Survey.update(oSurvey).where(Survey.id.equals(id)));
                return true;
            }
            return false;
        });
    };

    this.getMaxSurveyVersion = function (taskId) {
        var self = this;
        return co(function* () {
            var query = Task
                .select(sql.functions.MAX(Survey.surveyVersion))
                .from(
                Task
                    .join(SurveyMeta)
                    .on(SurveyMeta.productId.equals(Task.productId))
                    .leftJoin(Survey)
                    .on(Survey.id.equals(SurveyMeta.surveyId))
            )
                .where(Task.id.equals(taskId)
            );
            var result = yield thunkQuery(query);
            return _.first(result) ? result[0].max : 0;
        });
    };

    this.policyToDocx = function (surveyId, version) {
        var self = this;
        var oUser = new sUser(req);
        return co(function* () {

            // html header & footer
            var htmlHeader = '<!DOCTYPE html><html><head></head><body>';
            var htmlFooter = '</body></html>';
            var content = htmlHeader;

            var survey = yield self.getVersion(surveyId, version);


            if (survey.policyId) {
                var authorName = '';
                if (survey.author) {
                    var author = yield oUser.getById(survey.author);
                    if (author) {
                        authorName = author.firstName + ' ' + author.lastName;
                    }
                }
                content += '<table width="300" border="1">' +
                    '<tr><td>SECTION</td><td>' + survey.section + '</td></tr>' +
                    '<tr><td>SUBSECTION</td><td>' + survey.subsection + '</td></tr>' +
                    '<tr><td>NUMBER</td><td>' + survey.number + '</td></tr>' +
                    '<tr><td>TITLE</td><td>' + survey.title + '</td></tr>' +
                    '<tr><td>TYPE</td><td>Medical Policy</td></tr>' +
                    '<tr><td>AUTHOR</td><td>' + authorName + '</td></tr>' +
                    '</table>';

                if (_.first(survey.questions)) {
                    for (var i in survey.questions) {
                        if (survey.questions[i].type == 14) {
                            content += '<p><h1>' + survey.questions[i].label + '</h1></p>';
                            content += '<p>' + survey.questions[i].description + '</p>';
                        }
                    }
                }
            }

            content += htmlFooter;
            var docx = htmlDocx.asBlob(content);
            return docx;

        });
    }

};

module.exports = exportObject;
