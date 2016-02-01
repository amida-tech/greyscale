var sql = require('sql');

var columns = ['id', 'userId', 'value', 'created', 'optionId', 'comment'];

var SurveyAnswerVersion = sql.define({
    name: 'SurveyAnswerVersions',
    columns: columns
});

SurveyAnswerVersion.whereCol = columns;

module.exports = SurveyAnswerVersion;
