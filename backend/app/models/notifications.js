var sql = require('sql');

var Notification = sql.define({
    name: 'Notifications',
    columns: [
        'id',
        'userFrom',
        'userTo',
        'body',
        'note',
        'email',
        'message',
        'subject',
        'result',
        'essenceId',
        'entityId',
        'created',
        'read',
        'reading',
        'sent',
        'resent',
        'notifyLevel'
    ]
});

Notification.insertCols = [
    'userFrom',
    'userTo',
    'body',
    'note',
    'email',
    'message',
    'subject',
    'result',
    'essenceId',
    'entityId',
    'read',
    'reading',
    'sent',
    'resent',
    'notifyLevel'
];

Notification.updateCols = [
    'email',
    'message',
    'subject',
    'result',
    'read',
    'reading',
    'sent',
    'resent',
    'notifyLevel'
];

module.exports = Notification;
