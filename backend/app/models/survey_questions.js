var sql = require('sql');

var columns = [
    'id',
    'surveyId',
    'type',
    'label',
    'isRequired',
    'position'
];

var SurveyQuestion = sql.define({
    name: 'SurveyQuestions',
    columns: columns
});

SurveyQuestion.whereCol = columns;

module.exports = SurveyQuestion;
