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
    'surveyId',
    'isResponse',
    'isAgree',
    'comments',
    'langId',
    'attachments'

];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    columns: columns
});

SurveyAnswer.editCols = [
    'value',
    'optionId',
    'isResponse',
    'isAgree',
    'comments',
    'attachments'
];

SurveyAnswer.translate = [
    'value'
];


SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
