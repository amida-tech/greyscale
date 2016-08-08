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

SurveyQuestionOption.translate = [
    'value',
    'label'
];

module.exports = SurveyQuestionOption;
