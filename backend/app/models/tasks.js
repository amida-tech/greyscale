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
        //'userId',
        'userIds',
        'groupIds',
        'langId',
        'assessmentId',
        'isDeleted'
    ]
});

Task.editCols = [
    'title',
    'description',
    'startDate',
    'endDate',
    //'userId',
    'userIds',
    'groupIds',
    'assessmentId',
];

Task.translate = [
    'title',
    'description'
];

module.exports = Task;
