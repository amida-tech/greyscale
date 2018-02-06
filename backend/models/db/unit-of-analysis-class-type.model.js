'use strict';

module.exports = function unitOfAnalysisClassType(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UnitOfAnalysisClassType';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(45),
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(255),
            allowNull: false,
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
