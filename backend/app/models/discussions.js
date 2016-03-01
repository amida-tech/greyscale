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

Discussion.insertCols = [
    'taskId',
    'questionId',
    'userFromId',
    'userId',
    'order',
    'entry',
    'isReturn',
    'isResolve',
    'returnTaskId'
];

Discussion.updateCols = [
    'entry',
    'updated'
];

module.exports = Discussion;
