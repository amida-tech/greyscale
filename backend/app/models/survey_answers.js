var sql = require('sql');

var columns = ['id', 'userId', 'value', 'date', 'optionId', 'questionId'];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    schema: 'proto_amida',
    columns: columns
});

SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
