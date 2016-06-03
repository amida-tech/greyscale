var sql = require('sql');

var columns = [
    'id',
    'essenceId',
    'entityId',
    'filename',
    'size',
    'mimetype',
    'body',
    'created',
    'owner'
];

var Attachment = sql.define({
    name: 'Attachments',
    columns: columns
});

Attachment.editCols = ['filename'];

module.exports = Attachment;