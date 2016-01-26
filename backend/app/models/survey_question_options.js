var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'value'
];

var SurveyQuestionOption = sql.define({
    name: 'SurveyQuestionOptions',
    columns: columns
});

//SurveyQuestionOption.whereCol = columns;

module.exports = SurveyQuestionOption;