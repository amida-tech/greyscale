var config = require('config'),
    logger = require('app/logger'),
    util = require('util'),
    Client = require('pg').Client;

var ClientPG = function () {

    var client = new Client(config.pgConnect);

    client.on('error', function (err) {
        logger.error(util.format('Connection error: %s', err));
    });

    return client;
};

module.exports = ClientPG;
