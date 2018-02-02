'use strict';

process.env.NODE_ENV = 'test';

const config = require('./config');
const models = require('./models');

const db = models(config.pgConnect);

db.sequelize.sync({ force: true })
    .then(() => {
        console.log('success');
        process.exit(0);
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
