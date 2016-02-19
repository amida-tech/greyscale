var sql = require('sql');

var Discussion = sql.define({
    name: 'Discussions',
    columns: [
        'id',
        'taskId',
        'questionId',
        'userId',
        'entry',
        'flag',
        'created',
        'updated'
    ]
});

Discussion.editCols = [
    'questionId',
    'userId',
    'entry',
    'flag'
];

module.exports = Discussion;
