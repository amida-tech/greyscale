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
        'parentId',
        'isAgree',
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
    'hiddenAt',
    'parentId',
    'isAgree',
    'surveyVersion'
];

Comment.answerFromParentCols = [
    'taskId',
    'questionId',
    'userId',
    'stepId',
    'stepFromId',
    'surveyVersion'
];

Comment.updateCols = [
    'userId',
    'entry',
    'updated',
    'isReturn',
    'isResolve',
    'returnTaskId',
    'activated',
    'tags',
    'range',
    'commentType',
    'isHidden',
    'userHideId',
    'hiddenAt',
    'isAgree'

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
