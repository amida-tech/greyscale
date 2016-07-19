var config = require('../config'),
    util = require('util'),
    pg = require('pg'),
    debug = require('debug')('debug_db_bootstrap');

debug.log = console.log.bind(console);

var ClientPG = function () {

    var client = new Client(config.pgConnect);

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

// const pool = pg.connect(config.pgConnect, function(err, client, done) {
//   if (err) {
//       return debug("Could not instantiate a connection pool to the PostgreSQL server. Error: ", err)
//   }
// });

module.exports = pg;
