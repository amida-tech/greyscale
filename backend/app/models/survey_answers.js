var sql = require('sql');

var columns = ['id', 'surveyId', 'userId', 'data', 'date'];

var SurveyAnswer = sql.define({
    name: 'SurveyAnswers',
    columns: columns
});

module.exports = SurveyAnswer;