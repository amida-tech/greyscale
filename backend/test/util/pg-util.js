'use strict';

const pg = require('pg');

const runQuery = function(pgConnect, query, params, callback) {
    const cb = callback || params;

    pg.connect(pgConnect, function(err, client, done) {
        if (err) {
            return cb(err);
        }
        client.query(query, params || [], function(err, result) {
            done();
            if (err) {
                return cb(err);
            }
            cb(null, result);
        });
    });
};

const createDatabase = function (pgConnect, dbName, callback) {
    const query = `CREATE DATABASE ${dbName} OWNER indabauser`;
    runQuery(pgConnect, query, callback);
};

const dropDatabase = function (pgConnect, dbName, callback) {
    const query = `DROP DATABASE IF EXISTS ${dbName}`;
    runQuery(pgConnect, query, callback);
};

const resetDatabase = function resetDatabase(pgConnect, dbName, callback) {
    dropDatabase(pgConnect, dbName, function(err) {
        if (err) {
            return callback(err);
        }
        createDatabase(pgConnect, dbName, callback);
    });
};

module.exports = {
    runQuery,
    resetDatabase,
};
