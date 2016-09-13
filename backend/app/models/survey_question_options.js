var sql = require('sql');
var _ = require('underscore');

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

SurveyQuestionOption.insertCols = _.without(columns, 'id');

SurveyQuestionOption.editCols = ['value', 'label', 'isSelected'];

SurveyQuestionOption.translate = [
    'value',
    'label'
];

module.exports = SurveyQuestionOption;
