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
    schema: 'proto_amida',
    columns: columns
});

SurveyAnswer.editCols = [
    'value',
    'optionId'
];

SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
