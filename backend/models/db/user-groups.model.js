'use strict';

module.exports = function userGroups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserGroups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Groups',
                },
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
