var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'value'
];

var SurveyQuestionOption = sql.define({
    name: 'SurveyQuestionOptions',
    schema: 'proto_amida',
    columns: columns
});

//SurveyQuestionOption.whereCol = columns;

module.exports = SurveyQuestionOption;
