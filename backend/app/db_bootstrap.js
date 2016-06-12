var config = require('config'),
    logger = require('app/logger'),
    util = require('util'),
    Client = require('pg').Client,
    debug = require('debug')('debug_db_bootstrap');

debug.log = console.log.bind(console);

var ClientPG = function () {

    var client = new Client(config.pgConnect);

    client.on('error', function (err) {
        debug(util.format('Connection error: %s', err));
    });

    client.on('drain', client.end.bind(client));

    client.on('end', function(){
        debug('Client was disconnected.');
    });

    return client;
};

module.exports = ClientPG;
