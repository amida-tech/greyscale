var 
    _ = require('underscore'),
    config = require('config'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);


expObj = {
    set: function(client, key, value){
        return new Promise(function(resolve, reject){
            client.set(key, value,
                function(error, result){
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                }
                ,config.mc.lifetime
            );
        });
    },
    get: function(client, key){
        return new Promise(function(resolve, reject){
            client.get(key,function(error, result){
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }
};

module.exports = expObj;
