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
    columns: columns
});

//SurveyQuestionOption.whereCol = columns;

module.exports = SurveyQuestionOption;
