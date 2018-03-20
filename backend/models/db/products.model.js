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
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
        },
        projectId: {

            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Projects',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0,
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
