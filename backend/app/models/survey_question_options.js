var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'value',
    'label',
    'skip',
    'isSelected'
];

var SurveyQuestionOption = sql.define({
    name: 'SurveyQuestionOptions',
    schema: 'proto_amida',
    columns: columns
});

SurveyQuestionOption.translate = [
    'value',
    'label'
];

//SurveyQuestionOption.whereCol = columns;

module.exports = SurveyQuestionOption;
