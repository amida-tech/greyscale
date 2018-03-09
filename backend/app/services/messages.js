const request = require('request-promise');
const config = require('../../config');

module.exports = {
    SYSTEM_MESSAGE_USER_TOKEN_FIELD: 'SYSTEM_MESSAGE_USER_TOKEN',
    SYSTEM_MESSAGE_SUBJECT: 'System Message',
    authAsSystemMessageUser: function() {
        const path = '/auth/login';

        const requestOptions = {
            url: config.authService + path,
            method: 'POST',
            json: {
                username: config.systemMessageUser,
                password: config.systemMessagePassword,
            }
        };

        return request(requestOptions);
    },

    sendSystemMessage: function(token, recipient, message, subject) {
        const path = '/api/message/send';

        const requestOptions = {
            url: config.messageService + path,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            json: {
                to: [recipient],
                from: config.systemMessageUser,
                subject,
                message,
            }
        };

        return request(requestOptions);
    }
};
