var sql = require('sql');

var Task = sql.define({
    name: 'Tasks',
    schema: 'proto_amida',
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

Task.translate = [
    'title',
    'description'
];

module.exports = Task;
