var sql = require('sql');

var columns = [
    'id',
    'filename',
    'size',
    'mimetype',
    'body',
    'created',
    'owner',
    'amazonKey'
];

var Attachment = sql.define({
    name: 'Attachments',
    columns: columns
});

Attachment.editCols = ['filename'];

module.exports = Attachment;