var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    sPolicy = require('app/services/policies'),
    Survey = require('app/models/surveys'),
    co = require('co'),
    HttpError = require('app/error').HttpError;


var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getList = function () {
        return co(function* () {
            return yield thunkQuery(
                Survey
                    .select(
                        Survey.star(),
                        Policy.section, Policy.subsection, Policy.author, Policy.number,
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
                    .from(
                        Survey
                            .leftJoin(Policy)
                            .on(Survey.policyId.equals(Policy.id))
                    ),
                req.query
            );
        });
    };

    this.getById = function (id) {
        return co(function* () {
            var data =  yield thunkQuery(
                Survey
                    .from(
                        Survey
                            .leftJoin(Policy)
                            .on(Survey.policyId.equals(Policy.id))
                    )
                    .select(
                        Survey.star(),
                        Policy.section, Policy.subsection, Policy.author,
                        Policy.editor, Policy.startEdit, Policy.number,
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
                    .where(Survey.id.equals(id))
                    .group(Survey.id, Policy.id)
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

    this.deleteOne = function (id) {
        var self = this;
        var oPolicy = new sPolicy(req);
        return co(function* () {
            var survey = yield self.getById(id);
            // TODO delete survey questions, delete survey answers. What if answers already exists??
            if (survey) {
                yield thunkQuery(Survey.delete().where(Survey.id.equals(id)));
                if (survey.policyId) {
                    // Delete policy
                    yield oPolicy.deleteOne(survey.policyId);
                }
            }
        });
    }
}

module.exports = exportObject;