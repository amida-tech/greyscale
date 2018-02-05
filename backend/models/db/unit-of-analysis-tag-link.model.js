'use strict';

module.exports = function unitOfAnalysisTagLink(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UnitOfAnalysisTagLink';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        uoaId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        uoaTagId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
