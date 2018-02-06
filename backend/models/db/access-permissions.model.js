'use strict';

module.exports = function accessPermissions(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AccessPermissions';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        matrixId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: 'ids',
        },
        roleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: 'ids',
        },
        rightId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: 'ids',
        },
        permission: {
            type: Sequelize.SMALLINT,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
