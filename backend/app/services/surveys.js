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

    this.getList = function () {
        return co(function* () {
            return yield thunkQuery(
                Survey
                    .select(
                        Survey.star(),
                        Policy.id.as("policyId"), Policy.section, Policy.subsection, Policy.author, Policy.number,
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
                        //'(' +
                        //    'SELECT array_agg("Products"."id") ' +
                        //    'FROM "Products" ' +
                        //    'WHERE "Products"."surveyId" = "Surveys"."id"' +
                        //') as products'
                    )
                    .from(
                        Survey
                            .leftJoin(Policy)
                            .on(Survey.id.equals(Policy.surveyId))
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
                    .where(Survey.id.equals(id))
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