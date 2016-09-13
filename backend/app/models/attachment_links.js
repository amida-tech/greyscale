var sql = require('sql');

var columns = [
    'essenceId',
    'entityId',
    'attachments',
    'version'
];

var AttachmentLink = sql.define({
    name: 'AttachmentLinks',
    columns: columns
});

module.exports = AttachmentLink;
