var sql = require('sql');

var Discussion = sql.define({
    name: 'Discussions',
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
        'surveyVersion'
    ]
});

Discussion.insertCols = [
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
    'surveyVersion'
];

Discussion.updateCols = [
    'entry',
    'updated'
];

module.exports = Discussion;
