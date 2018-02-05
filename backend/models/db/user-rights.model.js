'use strict';

module.exports = function userRights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserRights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        rightID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        canDo: {
            type: Sequelize.BOOLEAN,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
