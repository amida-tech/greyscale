'use strict';

module.exports = function products(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Products';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        organizationId: {
            type: Sequelize.INTEGER
        },
        codeName: {
            type: Sequelize.STRING(100),
        },
        description: {
            type: Sequelize.TEXT,
        },
        created: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        matrixId: {
            type: Sequelize.INTEGER
        },
        startTime: {
            type: Sequelize.DATE,
        },
        status: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        adminUserId: {
            type: Sequelize.INTEGER
        },
        closeTime: {
            type: Sequelize.DATE,
        },
        firstActivated: {
            type: Sequelize.DATE(6),
        },
        langId: {
            type: Sequelize.INTEGER
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
