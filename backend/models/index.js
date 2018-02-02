'use strict';

const sequelizeGenerator = require('./sequelize-generator');
const db = require('./db');

module.exports = function defineDb(config) {
    const { Sequelize, sequelize } = sequelizeGenerator(config);
    return db(sequelize, Sequelize);
};
