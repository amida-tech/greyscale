'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

pg.types.setTypeParser(1184, value => value);

module.exports = function sequelizeGenerator(config) {
    const sequelizeOptions = {
        host: config.host,
        dialect: config.dialect,
        native: false,
        dialectOptions: {
            ssl: !!config.ssl,
        },
        port: config.port,
        pool: {
            max: config.poolMax,
            min: config.poolMin,
            idle: config.poolIdle,
        },
        logging: false,
        operatorsAliases: false,
    };

    const { name, user, pass } = config;
    const sequelize = new Sequelize(name, user, pass, sequelizeOptions);

    sequelize.addHook('beforeBulkSync', function (options) {
      // this = sequelize instance
      console.log('beforeBulkSync')
    })



    return { Sequelize, sequelize };
};
