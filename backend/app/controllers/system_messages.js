const common = require('../services/common');
const co = require('co');


module.exports = {
    send: function (req, res, next) {

        let result;
        co(function* () {
            if (
                !req.body.to ||
                !req.body.message
            ) {
                res.status(400).send('System message must have a \'to\' field and a \'message\' field').end();
            } else {

                console.log()
                console.log(`TRYING TO NOTIFY BY CALLING sendSystemMessageWithMessageService()`)

                const response = yield * common.sendSystemMessageWithMessageService(req, req.body.to, req.body.message);

                console.log(`RESPONSE FROM SEND IS ${response}`)

                if (response.statusCode === 204) {
                    console.log(`I GOT IN HERE AFTERALL`)
                    result = response;
                    res.status(204).end();
                } else {
                    res.status(400, response.message).end();
                    throw new Error(response.message);
                }
            }
            return result;
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }
}
