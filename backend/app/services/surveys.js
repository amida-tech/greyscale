var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Product = require('app/models/products'),
    co = require('co'),
    Query = require('app/util').Query,
    thunkify = require('thunkify'),
    officegen = require('officegen'),
    //htmlToJson = require('html-to-json'),
    HttpError = require('app/error').HttpError;

var debug = require('debug')('debug_service_surveys');
debug.log = console.log.bind(console);

var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
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
                        ') as att) as attachments',
                        '(' +
                            'SELECT array_agg("Products"."id") ' +
                            'FROM "Products" ' +
                            'WHERE "Products"."surveyId" = "Surveys"."id"' +
                        ') as products'
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

    this.policyToDocx = function (productId) {

        return co(function* () {
            var docx = officegen ( 'docx' );
            docx.on ( 'finalize', function ( written ) {
                // ...
                debug('Docx finalize');
            });
            docx.on ( 'error', function ( err ) {
                // ...
                debug('Docx error');
            });

            // get policy sections
            var policySections = yield thunkQuery(
                Product.select(
                    SurveyQuestion.label,
                    SurveyQuestion.description
                )
                    .from(
                    Product
                        .leftJoin(SurveyQuestion)
                        .on(Product.surveyId.equals(SurveyQuestion.surveyId))
                )
                    .where(Product.id.equals(productId)
                    .and(SurveyQuestion.type.equals(14))
                )
                .order(SurveyQuestion.position)
            );
            if (_.first(policySections)) {
                for (var i in policySections) {
                    debug(policySections[i].description);
                    }
                }

            var html2json = require('html2json').html2json;
            var json = html2json(policySections[1].description);

/*
            var dict = {
                sections: htmlToJson.createParser({
                    'text': function ($doc) {
                        return $doc.find('p').text();
                    }
                })
            };
            var promise = htmlToJson.batch(policySections[1].description,  dict);
            json = yield promise;

            promise.done(function (result) {
                //Works as well
                debug(result);
            });
*/


            var pObj = docx.createP ();

            pObj.addText (policySections[1].description);
            pObj.addText ( 'Bold + underline', { bold: true, underline: true } );
            pObj.addText ( 'Italic', { italic: true } );

            var pObj = docx.createP ({ pStyle: 1 });
            pObj.addText ( 'H1 Style');
/*
            pObj.addText ( ' with color', { color: '000088' } );
            pObj.addText ( ' and back color.', { color: '00ffff', back: '000088' } );
*/
            // ... (fill docx with data)

            return docx;
        });
    };

};

module.exports = exportObject;
