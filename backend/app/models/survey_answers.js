var sql = require('sql');

var columns = [
    'id',
    'questionId',
    'userId',
    'value',
    'created',
    'optionId',
    'productId',
    'UOAid',
    'wfStepId',
    'version'
];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    columns: columns
});

SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
