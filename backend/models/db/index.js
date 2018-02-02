'use strict';

const essences = require('./essences.model');
const tasks = require('./tasks.model');
const languages = require('./languages.model');

const defineTables = function (sequelize, Sequelize) {
    const Essences = essences(sequelize, Sequelize);
    const Tasks = tasks(sequelize, Sequelize);
    const Languages= languages(sequelize, Sequelize);

    return {
        sequelize,
        Essences,
        Languages,
        Tasks,
    };
};

module.exports = defineTables;
