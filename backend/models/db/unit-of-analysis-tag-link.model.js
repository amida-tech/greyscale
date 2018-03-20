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
            unique: 'uoataglink',
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
            unique: 'uoataglink',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'UnitOfAnalysisTagLink_uoaId_idx',
            fields: ['uoaId'],
        }, {
            name: 'UnitOfAnalysisTagLink_uoaTagId_idx',
            fields: ['uoaTagId'],
        }],
    });
};
