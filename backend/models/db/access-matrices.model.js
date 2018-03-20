'use strict';

module.exports = function accessMatrices(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AccessMatrices';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(100),
        },
        description: {
            type: Sequelize.TEXT,
        },
        default_value: {
            type: Sequelize.SMALLINT,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
