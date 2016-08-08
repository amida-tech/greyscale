var sql = require('sql');

var SurveyVersion = sql.define({
    name: 'SurveyVersions',
    columns: [
        'id',
        'surveyId',
        'created',
        'author',
        'version'
    ]
});

module.exports = SurveyVersion;
