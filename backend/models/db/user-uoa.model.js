'use strict';

module.exports = function userUoa(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UserUOA';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        UserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        UOAid: {
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
