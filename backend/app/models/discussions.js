var sql = require('sql');

var Discussion = sql.define({
    name: 'Discussions',
    columns: [
        'id',
        'taskId',
        'questionId',
        'userFromId',
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
    'userFromId',
    'userId',
    'order',
    'entry',
    'isReturn',
    'isResolve',
    'returnTaskId'
];

module.exports = Discussion;
