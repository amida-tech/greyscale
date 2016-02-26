var sql = require('sql');

var Task = sql.define({
    name: 'Tasks',
    columns: [
        'id',
        'title',
        'description',
        'uoaId',
        'stepId',
        'entityTypeRoleId',
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
    'entityTypeRoleId',
    'startDate',
    'endDate',
    'accessToDiscussions',
    'accessToResponses',
    'writeToAnswers',
    'userId'
];

module.exports = Task;
