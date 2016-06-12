var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'value',
    'label',
    'skip',
    'isSelected',
    'langId'
];

var SurveyQuestionOption = sql.define({
    name: 'SurveyQuestionOptions',
    columns: columns
});

SurveyQuestionOption.translate = [
    'value',
    'label'
];

//SurveyQuestionOption.whereCol = columns;

module.exports = SurveyQuestionOption;
