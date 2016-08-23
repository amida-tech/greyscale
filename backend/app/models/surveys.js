var sql = require('sql');

var columns = [
    'id',
    'title',
    'description',
    'created',
    'isDraft',
    'creator',
    'langId',
    'surveyVersion',
    'productId'
];

var Survey = sql.define({
    name: 'Surveys',
    columns: columns
});

Survey.insertCols = columns;
Survey.editCols = ['title', 'description', 'isDraft'];

Survey.translate = [
    'title',
    'description'
];

module.exports = Survey;
