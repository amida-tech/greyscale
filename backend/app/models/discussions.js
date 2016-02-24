var sql = require('sql');

var Discussion = sql.define({
    name: 'Discussions',
    columns: [
        'id',
        'taskId',
        'questionId',
        'userId',
        'order',
        'entry',
        'isReturn',
        'isResolve',
        'returnTaskId',
        'created',
        'updated'
    ]
});

Discussion.editCols = [
    'questionId',
    'userId',
    'order',
    'entry',
    'isReturn',
    'isResolve',
    'returnTaskId'
];

module.exports = Discussion;
