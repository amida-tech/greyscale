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
    'version',
    'surveyId'
];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    columns: columns
});

SurveyAnswer.editCols = [
    'value',
    'optionId'
];

SurveyAnswer.translate = [
    'value'
];


SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
