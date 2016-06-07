var sql = require('sql');

var AttachmentAttempt = sql.define({
    name: 'AttachmentAttempts',
    columns: [
        'key',
        'filename',
        'mimetype',
        'size'
    ]
});

module.exports = AttachmentAttempt;
