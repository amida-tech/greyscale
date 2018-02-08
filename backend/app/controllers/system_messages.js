const common = require('../services/common');
const co = require('co');


module.exports = {
    send: function (req, res) {

        if (
            !req.body.to ||
            !req.body.message
        ) {
            res.status(400).send('System message must have a \'to\' field and a \'message\' field').end();
        } else {
            common.sendSystemMessageWithMessageService(req, req.body.to, req.body.message)
            .then((response) => {
                if (response.statusCode === 204) {
                    res.status(204).end();
                } else {
                    res.status(400, res.message).end();
                    throw new Error(res.message);
                }
            })
        }
    }
}
