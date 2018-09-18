var config = require('../config/config'),
    util = require('util'),
    pg = require('pg'),
    debug = require('debug')('debug_db_bootstrap');

debug.log = console.log.bind(console);

var ClientPG = function () {

    var client = new pg.Client(config.pgConnect);

    client.on('error', function (err) {
        debug(util.format('Connection error: %s', err));
        client.end();
    });

    client.on('drain', client.end.bind(client));

    client.on('end', function () {
        debug('Client was disconnected.');
    });

    return client;
};

module.exports = pg;
