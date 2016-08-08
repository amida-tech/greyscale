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
        'activated',
        'tags',
        'range',
        'commentType',
        'isHidden',
        'userHideId',
        'hiddenAt',
        'surveyVersion'
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
    'activated',
    'tags',
    'range',
    'commentType',
    'isHidden',
    'userHideId',
    'hiddenAt'
];

Comment.updateCols = [
    'entry',
    'updated',
    'tags',
    'range',
    'commentType',
    'isHidden',
    'userHideId',
    'hiddenAt'
];

Comment.commentTypes = [{
    value: 0,
    name: 'CONTENT'
}, {
    value: 1,
    name: 'FORMAT'
}, {
    value: 2,
    name: 'STRUCTURE'
}];

module.exports = Comment;
