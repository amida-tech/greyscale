'use strict';

const sequelizeGenerator = require('./sequelize-generator');
const db = require('./db');

module.exports = function defineDb(config, schemas) {
    const { Sequelize, sequelize } = sequelizeGenerator(config, schemas);
    return db(sequelize, Sequelize, schemas);
};
