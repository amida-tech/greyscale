var
    _ = require('underscore'),
    moment = require('moment'),
    Policy = require('app/models/policies'),
    Survey = require('app/models/surveys'),
    User = require('app/models/users'),
    Workflow = require('app/models/workflows'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyAnswer = require('app/models/survey_answers'),
    SurveyMeta = require('app/models/survey_meta'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    sAttachment = require('app/services/attachments'),
    sEssence = require('app/services/essences'),
    sUser = require('app/services/users'),
    Task = require('app/models/tasks'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
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
                    .select(
                        Survey.star(),
                        SurveyMeta.productId,
                        '(WITH tmp AS (' +
                        '   SELECT "Users"."id","Users"."firstName", "Users"."lastName" ' +
                        '   FROM "Users" ' +
                        '   WHERE "Users"."id" = "Surveys"."creator"' +
                        ')' +
                        'SELECT row_to_json(tmp.*) as creator FROM tmp' +
                        ') '
                    )
                    .from(
                        Survey
                            .leftJoin(SurveyMeta)
                            .on(SurveyMeta.surveyId.equals(Survey.id))
                            .leftJoin(User)
                            .on(Survey.creator.equals(User.id))
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
                            .leftJoin(ProductUOA)
                            .on(Product.id.equals(ProductUOA.productId))
                            .leftJoin(Workflow)
                            .on(Workflow.productId.equals(Product.id))
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
                        '(' +
                        '   SELECT ' +
                        '       CASE WHEN ws.id IS NULL THEN FALSE' +
                        '       ELSE TRUE' +
                        '       END' +
                        '   FROM "WorkflowSteps" ws ' +
                        '   WHERE ws.id = "ProductUOA"."currentStepId" ' +
                        '   AND ws.position = (' +
                        '       SELECT max(subws.position) ' +
                        '       FROM "WorkflowSteps" subws ' +
                        '       WHERE subws."workflowId" = "Workflows".id' +
                        '   )' +
                        ') as "isLastStep", '+
                        'row_to_json("Products".*) as product',
                        'row_to_json("Workflows".*) as workflow',
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
                    .group(
                        Survey.id, Survey.surveyVersion, Policy.id, SurveyMeta.productId,
                        Product.id, Workflow.id, ProductUOA.currentStepId, '"isLastStep"'
                    )
            );
            if (data[0]) {
                if (data[0].product) {
                    data[0].product.isLastStep = data[0].isLastStep;
                }
                delete data[0].isLastStep;
                return data[0];
            }
            return false;
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

    this.checkQuestionData = function (surveyId, surveyVersion, dataObj, isCreate) {
        var question;
        return co(function* () {
            if (isCreate) {
                if (
                    typeof dataObj.label === 'undefined' ||
                    typeof dataObj.type === 'undefined'
                ) {
                    throw new HttpError(403, 'label and type fields are required');
                }
            } else {
                question = yield thunkQuery(
                    SurveyQuestion.select()
                        .where(
                            SurveyQuestion.id.equals(dataObj.id)
                            .and(SurveyQuestion.surveyVersion.equals(surveyVersion))
                        )
                );
                if (!_.first(question)) {
                    throw new HttpError(
                        403,
                        'Survey question with id = ' + dataObj.id + ' and ' +surveyVersion + ' version does not exist'
                    );
                }
                question = _.first(question);
            }

            dataObj.surveyId = surveyId;
            dataObj.surveyVersion = surveyVersion;

            if (dataObj.type) {
                if (!(parseInt(dataObj.type) in SurveyQuestion.types)) {
                    throw new HttpError(
                        403,
                        'Type value should be from 0 till ' + Object.keys(SurveyQuestion.types).length - 1
                    );
                }
            }

            var maxPos = yield thunkQuery(
                SurveyQuestion
                    .select('max("SurveyQuestions"."position")')
                    .where(SurveyQuestion.surveyId.equals(surveyId))
                    .and(SurveyQuestion.surveyVersion.equals(surveyVersion))
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
                        'AND ("SurveyQuestions"."surveyVersion" = ' + surveyVersion + ') ' +
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
                            'AND ("SurveyQuestions"."surveyVersion" = ' + surveyVersion + ') ' +
                            'AND ("SurveyQuestions"."position" > ' + question.position + ')' +
                            'AND ("SurveyQuestions"."position" <= ' + dataObj.position + ')' +
                            ')';
                    } else {
                        q =
                            'UPDATE "SurveyQuestions" SET "position" = "position"+1 ' +
                            'WHERE (' +
                            '("SurveyQuestions"."surveyId" = ' + surveyId + ') ' +
                            'AND ("SurveyQuestions"."surveyVersion" = ' + surveyVersion + ') ' +
                            'AND ("SurveyQuestions"."position" < ' + question.position + ')' +
                            'AND ("SurveyQuestions"."position" >= ' + dataObj.position + ')' +
                            ')';
                    }

                    yield thunkQuery(q);
                }
            }
            return dataObj;
        });
    }

    this.unlockSurvey = function (id, socketId) {
        return co(function* () {
            var editFields = {
                socketId: null,
                editor: null,
                startEdit: null
            };

            return yield thunkQuery(
                SurveyMeta
                    .update(editFields)
                    .where({socketId: socketId, surveyId: id})
                    .returning(SurveyMeta.star())
            );
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
            questionData = yield self.checkQuestionData(surveyId, surveyVersion, questionData, true);
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
            var options = yield req.thunkQuery(
                'SELECT a.*, array_agg(b.id) as answers' +
                ' FROM "SurveyQuestionOptions" a' +
                ' LEFT JOIN "SurveyAnswers" b' +
                ' ON a.id = ANY(b."optionId")' +
                ' WHERE a."questionId" = ' + questionId +
                ' AND a."surveyVersion" = ' + surveyVersion +
                ' group by a.id'
            );
            for (var i in options) {
                if (Array.isArray(options[i].answers) && options[i].answers[0]) {
                    throw new HttpError(
                        400,
                        'Cannot delete option (id = ' + options[i].id + '), because there are some answers, contain this option'
                    );
                } else {
                    yield thunkQuery(
                        SurveyQuestionOption.delete().where({id: options[i].id})
                    );
                }
            }
        });
    };

    // Actualy, we can update only questions in draft (version = -1)
    this.updateVersionQuestion = function (surveyId, surveyVersion, questionId, fullQuestionData) {
        var self = this;
        return co(function* () {
            var questionData = _.pick(fullQuestionData, SurveyQuestion.editCols);
            questionData.id = questionId;
            yield self.checkQuestionData(surveyId, surveyVersion, questionData, false);
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
        var self = this;
        return co(function* (){
            yield self.deleteVersionQuestionOptions(questionId, surveyVersion);
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

            if (surveyId) {
                surveyData.id = surveyId;
            } else {
                delete surveyData.id;
            }

            yield self.checkSurveyData(fullSurveyData);

            if (fullSurveyData.isPolicy) {
                yield self.checkPolicyData(policyData);
            }

            yield thunkQuery(Survey.delete().where({id: surveyId, surveyVersion: -1}));
            var surveyDraft = yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));

            if (!surveyId) {
                surveyId = surveyDraft[0].id;
            }

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
                        .leftJoin(ProductUOA)
                        .on(Product.id.equals(ProductUOA.productId))
                        .leftJoin(Workflow)
                        .on(Workflow.productId.equals(Product.id))
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
                        '(' +
                        '   SELECT ' +
                        '       CASE WHEN ws.id IS NULL THEN FALSE' +
                        '       ELSE TRUE' +
                        '       END' +
                        '   FROM "WorkflowSteps" ws ' +
                        '   WHERE ws.id = "ProductUOA"."currentStepId" ' +
                        '   AND ws.position = (' +
                        '       SELECT max(subws.position) ' +
                        '       FROM "WorkflowSteps" subws ' +
                        '       WHERE subws."workflowId" = "Workflows".id' +
                        '   )' +
                        ') as "isLastStep", '+
                        'row_to_json("Products".*) as product',
                        'row_to_json("Workflows".*) as workflow',
                        'ARRAY (SELECT "UOAid" FROM "ProductUOA" WHERE "productId" = "SurveyMeta"."productId") as uoas, ' +
                        '(WITH usr AS ' +
                        '(SELECT "id", "firstName", "lastName", "email" FROM "Users" WHERE "id" = "Policies"."author")' +
                        'SELECT row_to_json(usr.*) as author FROM usr), ' +
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
                    .group(
                        Survey.id, Survey.surveyVersion, Policy.id,
                        SurveyMeta.productId, Product.id, Workflow.id, ProductUOA.currentStepId, '"isLastStep"'
                    )
            );
            if (data[0]) {
                if (data[0].product) {
                    data[0].product.isLastStep = data[0].isLastStep;
                }
                delete data[0].isLastStep;
                return data[0];
            }
            return false;
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

    this.getLastSurveyVersion = function (surveyId) {
        var self = this;
        return co(function* () {
            var query = Survey
                .select(sql.functions.MAX(Survey.surveyVersion))
                .from(Survey)
                .where(Survey.id.equals(surveyId)
            );
            var result = yield thunkQuery(query);
            return _.first(result) ? result[0].max : 0;
        });
    };

    this.policyToDocx = function (surveyId, version) {
        var self = this;
        var oUser = new sUser(req);
        var sComment = require('app/services/comments');
        var oComment = new sComment(req);
        return co(function* () {

            // html header & footer
            var htmlStyles = '<style>' +
                'body { ' +
                'font-family: "Times", serif;' +
                'font-size: 13pt' +
                '} ' +
                'table, th, td {border: 1px solid black;}' +
                '</style>';
            var htmlHeader = '<!DOCTYPE html><html><head><meta charset="utf-8">' + htmlStyles + '</head><body>';
            var htmlFooter = '</body></html>';
            var content = htmlHeader,
                _ancor_id,
                _idx = 0;

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

                var comments = yield oComment.getComments({surveyId: surveyId}, null, null, null, null, version);
                var commentsContent = comments.length ? '<hr/><h1>COMMENTS</h1>' : '';

                if (_.first(survey.questions)) {
                    for (var i in survey.questions) {
                        if (survey.questions[i].type == 14) {
                            var existHeader = false;

                            for (var j in comments) {
                                if (comments[j].questionId == survey.questions[i].id) {
                                    if (!existHeader) {
                                        commentsContent += '<h2>' + survey.questions[i].label + '</h2>';
                                        existHeader = true;
                                    }
                                    var comment = '';
                                    var commentAuthor = yield oUser.getById(comments[j].userFromId);

                                    if (comments[j].range) {
                                        try{
                                            comments[j].range = JSON.parse(comments[j].range);
                                        } catch (err) {
                                            console.log(err);
                                            comments[j].range = {};
                                        }
                                        if (comments[j].range.entry) {
                                            comment +=
                                                '<font color="#a9a9a9"><b><i>&laquo;'
                                                + comments[j].range.entry.replace(/(<([^>]+)>)/ig,"")
                                                + '&raquo;</i></b></font><br/>';
                                        }
                                    }

                                    var authorStr = commentAuthor ? (' by ' + commentAuthor.firstName + ' ' + commentAuthor.lastName) : '';
                                    var dateStr = moment(comments[j].created).format('MM/DD/YYYY HH:mm');
                                    _idx++;
                                    _ancor_id = 'rem' + comments[j].id;
                                    commentsContent +=
                                        '<p><sup><a name="' + _ancor_id + '" href="#b' + _ancor_id + '">'
                                        + _idx + '</a></sup> (' + dateStr + authorStr + ')<br/>'
                                        + comment
                                        + comments[j].entry
                                        + '</p><hr/>';

                                    _linkComment(survey.questions[i], comments[j], _idx);
                                }
                            }

                            content += '<p><h1>' + survey.questions[i].label + '</h1></p><p>'
                                + survey.questions[i].description + '</p>';
                        }
                    }
                }

                content += commentsContent;


            }
            content += htmlFooter;
            content = _preHtml(content);
            return htmlDocx.asBlob(content);

            function _linkComment(question, comment, idx) {
                var i,
                    _fTag = false,
                    _fSup = 0,
                    _ancor = 'rem' + comment.id,
                    _lnk = '<sup><a name="b' + _ancor + '" href="#' + _ancor + '">[' + idx + ']</a></sup>',
                    _offset = comment.range.end,
                    _descr = question.description,
                    _strL = _descr.length,
                    symbolRe = /&.+?;/ig,
                    _symbol = symbolRe.exec(_descr);

                for (i = 0; i < _strL; i++) {
                    //remove html extended symbols
                    if (_symbol && i === _symbol.index) {
                        i += _symbol[0].length - 1;
                        _symbol = symbolRe.exec(_descr);
                    }

                    if (_offset === 0) {
                        symbolRe = /[\b\s<]/g;
                        symbolRe.lastIndex = i ? i - 1 : i;
                        _symbol = symbolRe.exec(_descr);
                        if (_symbol) {
                            i = _symbol.index;
                        }
                        question.description = [_descr.slice(0, i), _lnk, _descr.slice(i)].join('');
                        return;
                    }

                    if (_descr[i] === '<') {
                        _fTag = true;
                        if (_descr.substr(i + 1, 4) === 'sup>') {
                            _fSup++;
                        }
                        if (_descr.substr(i + 1, 5) === '/sup>') {
                            _fSup--;
                        }
                    } else if (_descr[i] === '>') {
                        _fTag = false;
                    } else {
                        if (!_fTag && _fSup <= 0) {
                            _offset--;
                            _fSup = 0;
                        }
                    }
                }
            }

            function _preHtml(body) {
                return body.replace(new RegExp(String.fromCharCode(160),'g'), '&nbsp;');
            }
        });
    };
};

module.exports = exportObject;
