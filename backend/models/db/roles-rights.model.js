'use strict';

module.exports = function rolesRights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'RolesRights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        roleID: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        rightID: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
