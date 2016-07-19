var
    _ = require('underscore'),
    config = require('../config'),
    co = require('co'),
    Query = require('./util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

var expObj = {
    set: function (client, key, value, lifetime) {
        if (typeof lifetime === 'undefined') {
            lifetime = config.mc.lifetime;
        }
        return new Promise(function (resolve, reject) {
            client.set(key, value,
                function (error, result) {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                },
                lifetime
            );
        });
    },
    get: function (client, key) {
        return new Promise(function (resolve, reject) {
            client.get(key, function (error, result) {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    },
    delete: function (client, key) {
        return new Promise(function (resolve, reject) {
            client.delete(key, function (error, result) {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

};

module.exports = expObj;
