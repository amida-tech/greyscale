var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
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
                        Policy.section, Policy.subsection, Policy.author, Policy.editor, Policy.number,
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

    this.setEditor = function (id, userId) { // for safety, have to do separate update method
        return co(function* () {
            return yield thunkQuery(Policy.update({editor: userId}).where(Policy.id.equals(id)));
        });
    };
}

module.exports = exportObject;