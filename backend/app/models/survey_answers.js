var sql = require('sql');

var columns = ['id', 'surveyId', 'userId', 'data', 'date'];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    schema: 'proto_amida',
    columns: columns
});

SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
