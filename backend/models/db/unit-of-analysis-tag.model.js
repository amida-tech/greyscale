'use strict';

module.exports = function unitOfAnalysisTag(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UnitOfAnalysisTag';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(45),
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(255),
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
        },
        classTypeId: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysisClassType',
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
