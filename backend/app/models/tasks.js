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
    'groupIds'
];

Task.translate = [
    'title',
    'description'
];

module.exports = Task;
