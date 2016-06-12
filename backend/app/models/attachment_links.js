var sql = require('sql');

var columns = [
    'essenceId',
    'entityId',
    'attachments'
];

var AttachmentLink = sql.define({
    name: 'AttachmentLinks',
    columns: columns
});

module.exports = AttachmentLink;
