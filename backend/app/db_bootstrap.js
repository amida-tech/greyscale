var config = require('config'),
  logger = require('app/logger'),
  util = require('util'),
  Client = require('pg').Client;

var ClientPG = function() {
  var client = new Client(config.pgConnect);
  console.log(config.pgConnect);
  client.on('error', function (err) {
    logger.error(util.format('Connection error: %s', err));
  });

  client.connect(function (err, client) {
    console.log('connection!')
     if (!err) {
       console.log(err);
     }
  });

  return client;
};




module.exports = ClientPG;
