const common = require('../services/common');

module.exports = {
    send: (req, res) => {
        if (
            !req.body.to ||
            !req.body.message
        ) {
            res.status(400).send('System message must have a \'to\' field and a \'message\' field').end();
        } else {
            const response = yield * common.sendSystemMessageWithMessageService(req, req.body.to, req.body.message);

            if (response.statusCode === 204) {
                res.status(204).end();
            } else {
                res.status(400, response.message).end();
                throw new Error(response.message);
            }
        }
    }
}
