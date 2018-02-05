'use strict';

module.exports = function userGroups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserGroups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
