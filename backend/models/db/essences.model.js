'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Essences';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        tableName: {
            type: Sequelize.STRING(100),
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Human readable name of essence',
        },
        fileName: {
            type: Sequelize.STRING(100),
        },
        nameField: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
