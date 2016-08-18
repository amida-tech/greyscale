var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    Survey = require('app/models/surveys'),
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

    this.createVersion = function (fullSurveyData, surveyId) { // TODO full data or not?
        var self = this;
        return co(function* () {
            var surveyData = yield self.checkSurveyData(fullSurveyData, surveyId);
            var surveyVersion;
            if (surveyId) {
                surveyData.id = surveyId;
            }
            surveyVersion = yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));

            yield self.deleteDraft(surveyId);

            return surveyVersion;
        });
    };

    this.deleteDraft = function (surveyId) {
        return co(function* (){
            yield thunkQuery(
                Survey
                .delete()
                .where(
                    Survey.id.equals(surveyId)
                    .and(Survey.surveyVersion.equals(-1))
                )
            );
        });
    };

    this.updateDraft = function (surveyId, surveyData) {
        return co(function* () {
            return yield thunkQuery(
                Survey.update(surveyData)
                .where(
                    Survey.id.equals(surveyId)
                    .and(Survey.surveyVersion.equals(-1))
                )
                .returning(Survey.star())
            )
        });
    };

    this.createDraft = function (surveyId, surveyData) {
        return co(function* () {
            surveyData.surveyVersion = -1;
            surveyData.id = surveyId;
            return yield thunkQuery(Survey.insert(surveyData).returning(Survey.star()));
        });
    };

    this.saveDraft = function (fullSurveyData, surveyId) { // TODO full data or not?
        var self = this;
        return co(function* () {
            var surveyData = yield self.checkSurveyData(fullSurveyData, surveyId);
            var draft = yield self.getVersion(surveyId, -1);
            if (!draft) {
                draft = self.createDraft(surveyId, surveyData);
            } else {
                draft = self.updateDraft(surveyId, surveyData);
            }
            return draft;
        });
    };

    this.checkSurveyData = function (surveyData, surveyId) {
        return co(function* () {
            if (!surveyId) { // create
                surveyData = _.pick(surveyData, Survey.insertCols);
                if (!req.body.title || !req.body.productId) {
                    throw new HttpError(403, 'title and productId fields are required');
                }
            } else { // update
                surveyData = _.pick(surveyData, Survey.editCols);
            }
            return surveyData;
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