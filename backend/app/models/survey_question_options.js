var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'value',
    'label',
    'skip',
    'isSelected',
    'langId',
    'surveyVersion'
];

var SurveyQuestionOption = sql.define({
    name: 'SurveyQuestionOptions',
    columns: columns
});

SurveyQuestionOption.insertCols = columns.splice(columns.indexOf('id'), 1);
SurveyQuestionOption.editCols = ['value', 'label', 'isSelected'];

SurveyQuestionOption.translate = [
    'value',
    'label'
];

module.exports = SurveyQuestionOption;
