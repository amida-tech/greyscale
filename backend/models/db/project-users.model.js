'use strict';

module.exports = function projectUsers(sequelize, Sequelize, schema = 'public') {
    const tableName = 'ProjectUsers';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Projects',
                },
                key: 'id',
            },
        },
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
