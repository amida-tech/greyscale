'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Logs';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        created: {
            type: Sequelize.DATE(6),
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        action: {
            type: Sequelize.STRING,
        },
        essence: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        entity: {
            type: Sequelize.INTEGER,
        },
        entities: {
            type: Sequelize.STRING,
        },
        quantity: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        info: {
            type: Sequelize.TEXT,
        },
        error: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        result: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
