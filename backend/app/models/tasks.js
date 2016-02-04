var sql = require('sql');

var Task = sql.define({
    name: 'Tasks',
    columns: [
        'id',
        'title',
        'description',
        'uaoId',
        'stepId',
        'entityTypeRoleId',
        'created'
    ]
});

module.exports = Task;
