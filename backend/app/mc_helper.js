var
    _ = require('underscore'),
    config = require('config'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    crypto = require('crypto'),
    md5 = crypto.createHash('md5'),
    thunkQuery = thunkify(query);


md5.update(config.domain);
var prefix = md5.digest('hex');

var expObj = {
    set: function (client, key, value, lifetime) {
        key = prefix + key;
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
        key = prefix + key;
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
        key = prefix + key;
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
