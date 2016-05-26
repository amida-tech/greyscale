var sql = require('sql');

var Comment = sql.define({
    name: 'Comments',
    columns: [
        'id',
        'taskId',
        'questionId',
        'userFromId',
        'userId',
        'stepId',
        'stepFromId',
        'order',
        'entry',
        'isReturn',
        'isResolve',
        'returnTaskId',
        'created',
        'updated',
        'activated'
    ]
});

Comment.insertCols = [
    'taskId',
    'questionId',
    'userFromId',
    'userId',
    'stepId',
    'stepFromId',
    'order',
    'entry',
    'isReturn',
    'isResolve',
    'returnTaskId',
    'activated'
];

Comment.updateCols = [
    'entry',
    'updated'
];

module.exports = Comment;
