'use strict';

const debug = require('debug');

const debugHandler = debug('debug_bootstrap');
const errorHandler = debug('error');

debugHandler.log = console.log.bind(console);

module.exports = {
    debug: debugHandler,
    error: errorHandler,
};
