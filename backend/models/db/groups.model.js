'use strict';

module.exports = function groups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Groups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: 'character varying',
        },
        organizationId: {
            type: Sequelize.INTEGER,
             references: {
                model: {
                    schema,
                    tableName: 'Organizations',
                },
                key: 'id',
            },
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
