var sql = require('sql');

var columns = ['id', 'userId', 'value', 'date', 'optionId', 'questionId'];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    columns: columns
});

SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
