const messageService = require('../services/messages');
const logger = require('../logger');

module.exports = {
    send: (req, res) => {
        if (
            !req.body.to ||
            !req.body.message
        ) {
            res.status(400).send('System message must have a \'to\' field and a \'message\' field').end();
        } else {
            messageService.sendSystemMessage(
                req.app.get(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD),
                req.body.to,
                req.body.message,
                messageService.SYSTEM_MESSAGE_SUBJECT
            )
            .then(() => {
                res.status(204).end();
            })
            .catch((err) => {
                if (err.statusCode === 401) {
                    logger.debug('Attempt to send a system message was unauthorized');
                    logger.debug('Reauthenticating and trying again');
                    return messageService.authAsSystemMessageUser()
                    .then((auth) => {
                        req.app.set(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD, auth.token);
                    })
                    .then(() =>
                        messageService.sendSystemMessage(
                            req.app.get(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD),
                            req.body.to,
                            req.body.message,
                            messageService.SYSTEM_MESSAGE_SUBJECT
                        )
                        .then((resp) => {
                            logger.debug(resp);
                            res.status(204).end();
                        })
                    )
                }
                throw err;
            }).catch(() => {
                res.status(400).send('Failed to send system message');
            });
        }
    }
}
