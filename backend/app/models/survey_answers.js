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
    'attachments',
    'answerComment',
    'links'
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
    'attachments',
    'answerComment',
    'links'
];

SurveyAnswer.translate = [
    'value',
    'comments'
];


SurveyAnswer.whereCol = columns;

module.exports = SurveyAnswer;
