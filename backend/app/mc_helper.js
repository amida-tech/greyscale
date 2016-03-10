var 
    _ = require('underscore'),
    config = require('config'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);
    memcache = require('memcache');

expObj = {
    client: new memcache.Client(
        config.mc.port,
        config.mc.host
    ),
    connect: function(){
        client = this.client;
        return new Promise(function(resolve,reject) {
            client.on('connect', function(){
                console.log('mc connected');
                resolve('connect');
            });

            client.on('error', function(e){
                reject(e);
            });

            client.connect();
        });
    },
    set: function(key, value){
        client = this.client;
        return new Promise(function(resolve, reject){
            client.set(key, value, function(error, result){
                if (error) {
                    reject(error);
                }
                resolve(result);
            }, config.mc.lifetime);
        });
    },
    get: function(key){
        client = this.client;
        return new Promise(function(resolve, reject){
            client.get(key,function(error, result){
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    },
    close: function(){
        client = this.client;
        return new Promise(function(resolve,reject) {
            client.on('close', function(){
                console.log('mc closed');
                resolve('closed');
            });

            client.on('error', function(e){
                reject(e);
            });

            client.close();
        });

    }    
};

module.exports = expObj;
