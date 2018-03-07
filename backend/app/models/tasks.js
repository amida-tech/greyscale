var sql = require('sql');

var Task = sql.define({
    name: 'Tasks',
    columns: [
        'id',
        'description',
        'uoaId',
        'stepId',
        'created',
        'productId',
        'startDate',
        'endDate',
        'userIds',
        'groupIds',
        'langId',
        'assessmentId',
        'isDeleted'
    ]
});

Task.editCols = [
    'description',
    'startDate',
    'endDate',
    'userIds',
    'groupIds',
    'assessmentId',
];

Task.translate = [
    'title',
    'description'
];

module.exports = Task;
