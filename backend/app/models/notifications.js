var sql = require('sql');

var Notification = sql.define({
    name: 'Notifications',
    columns: [
        'id',
        'userFrom',
        'userTo',
        'body',
        'email',
        'message',
        'sentResult',
        'essenceId',
        'entityId',
        'created',
        'read',
        'readingTime',
        'sent'
    ]
});

Notification.insertCols = [
    'userFrom',
    'userTo',
    'body',
    'email',
    'message',
    'sentResult',
    'essenceId',
    'entityId',
    'read',
    'readingTime',
    'sent'
];

Notification.updateCols = [
    'sentResult',
    'read',
    'readingTime',
    'sent'
];

Notification.create = function () {
    return false;
};


module.exports = Notification;
