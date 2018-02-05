'use strict';

module.exports = function products(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Products';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: Sequelize.STRING(100),
        },
        description: {
            type: Sequelize.TEXT,
        },
        originalLangId: {
            type: Sequelize.INTEGER
        },
        projectId: {
            type: Sequelize.INTEGER
        },
        surveyId: {
            type: Sequelize.INTEGER
        },
        status: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0
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
