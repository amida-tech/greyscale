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
        'productId'
    ]
});

module.exports = Task;
