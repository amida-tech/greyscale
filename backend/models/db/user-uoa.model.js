'use strict';

module.exports = function userUoa(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserUOA';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        UserId: {
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
        UOAid: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysis',
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
