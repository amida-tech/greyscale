var sql = require('sql');

var Task = sql.define({
    name: 'Tasks',
    columns: [
        'id',
        'title',
        'description',
        'uoaId',
        'stepId',
        'created',
        'productId',
        'startDate',
        'endDate',
        'accessToDiscussions',
        'accessToResponses',
        'writeToAnswers',
        'userId'
    ]
});

Task.editCols = [
    'title',
    'description',
    'startDate',
    'endDate',
    'accessToDiscussions',
    'accessToResponses',
    'writeToAnswers',
    'userId'
];

module.exports = Task;
