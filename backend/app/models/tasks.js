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
        'langId'
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

Task.all = function * (req) {
    return yield req.thunkQuery(Task.select(Task.star()).from(Task));
};

module.exports = Task;
