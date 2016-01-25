var winston = require('winston'),
    config = require('config'),
    Logger = require('lib/logger');

var wlogger = new winston.Logger();

if (config.logging) {
    switch (config.logging.transport) {
    case 'console':
        wlogger.add(winston.transports.Console, config.logging.options);
        break;

    }
}

module.exports = new Logger(wlogger);
