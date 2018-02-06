'use strict';

module.exports = function organizations(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Organizations';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(100),
        },
        address: {
            type: Sequelize.STRING(200),
        },
        adminUserId: {
            type: Sequelize.INTEGER,
            unique: true,
        },
        url: {
            type: Sequelize.STRING(200),
        },
        enforceApiSecurity: {
            type: Sequelize.SMALLINT,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
        },
        langId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
        },
        realm: {
            type: Sequelize.STRING(80),
        },
        enableFeaturePolicy: {
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
