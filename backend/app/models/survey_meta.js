var sql = require('sql');

var columns = [
    'surveyId',
    'productId',
    'editor',
    'startEdit',
    'socketId'
];

var SurveyMeta = sql.define({
    name: 'SurveyMeta',
    columns: columns
});

SurveyMeta.insertCols = columns;
SurveyMeta.editCols = ['productId', 'editor', 'startEdit', 'socketId'];

module.exports = SurveyMeta;
