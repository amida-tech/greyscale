'use strict';

module.exports = function userRights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserRights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userID: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        rightID: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        canDo: {
            type: Sequelize.BOOLEAN,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
