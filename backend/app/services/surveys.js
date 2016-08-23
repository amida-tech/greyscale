var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    co = require('co'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError;


var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

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
                '    (SELECT array_agg(row_to_json(att)) ' +
                '       FROM ( ' +
                '           SELECT a."id", a."filename", a."size", a."mimetype" ' +
                '           FROM "AttachmentLinks" al ' +
                '           JOIN "Attachments" a ' +
                '           ON al."entityId" = "Policies"."id" ' +
                '           JOIN "Essences" e ' +
                '           ON e.id = al."essenceId" ' +
                '           AND e."tableName" = \'Policies\' ' +
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
                'LEFT JOIN "Policies" ' +
                'ON ("Surveys"."id" = "Policies"."surveyId")'
            );
        });
    };

    this.getVersions = function (surveyId) {
        return co(function* () {
           return yield thunkQuery(
               Survey.select().where(Survey.id.equals(surveyId).and(Survey.surveyVersion.gte(0)))
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
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
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
                    .where(Survey.id.equals(id).and(Survey.surveyVersion.equals(version)))
                    .group(Survey.id, Survey.surveyVersion, Policy.id)
            );
            return data[0] || false;
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

            var surveyVersion = yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));
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

            yield self.deleteDraft(surveyId);

            return surveyVersion;
        });
    };

    this.deleteDraft = function (surveyId) {
        var self = this;
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

            return surveyDraft;
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
                if (!req.body.title || !req.body.productId) {
                    throw new HttpError(403, 'title and productId fields are required');
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
                    )
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
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
                    .group(Survey.id, Survey.surveyVersion, Policy.id)
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


}

module.exports = exportObject;