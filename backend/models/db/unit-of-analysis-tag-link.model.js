'use strict';

module.exports = function unitOfAnalysisTagLink(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UnitOfAnalysisTagLink';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        uoaId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysis',
                },
                key: 'id',
            },
        },
        uoaTagId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysisTag',
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
