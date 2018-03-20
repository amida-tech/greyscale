'use strict';

module.exports = function roles(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Roles';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(20),
            allowNull: false,
        },
        isSystem: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
