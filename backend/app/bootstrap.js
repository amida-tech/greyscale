'use strict';

if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

const appGenerator = require('./app-generator');

const app = appGenerator.generate();

app.on('start', function () {
    app.locals.mcClient.connect();
});

app.emit('start');

module.exports = app;
