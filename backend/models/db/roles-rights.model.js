'use strict';

module.exports = function rolesRights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'RolesRights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        roleID: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        rightID: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Rights',
                },
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{ fields: ['rightID'] }],
    });
};
