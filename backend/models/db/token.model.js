'use strict';

module.exports = function tokens(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Token';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        body: {
            type: Sequelize.STRING(200),
            allowNull: false,
        },
        issuedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        realm: {
            type: Sequelize.STRING(80),
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
