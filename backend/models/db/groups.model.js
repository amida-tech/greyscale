'use strict';

module.exports = function groups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Groups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: Sequelize.STRING,
        },
        organizationId: {
            type: Sequelize.INTEGER,
        },
        langId: {
            type: Sequelize.INTEGER,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
