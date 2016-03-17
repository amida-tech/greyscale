var sql = require('sql');

var columns = [
    'id',
    'answerId',
    'filename',
    'size',
    'mimetype',
    'body',
    'created',
    'owner'
];

var AnswerAttachment = sql.define({
    name: 'AnswerAttachments',
    columns: columns
});

AnswerAttachment.editCols = ['filename'];

module.exports = AnswerAttachment;
