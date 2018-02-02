'use strict';

module.exports = function languages(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Languages';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(100),
        },
        nativeName: {
            type: Sequelize.STRING(100),
        },
        code: {
            type: Sequelize.STRING(3),
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
