'use strict';

if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

const appGenerator = require('./app-generator');

const app = appGenerator.generate();

app.emit('start');

module.exports = app;
