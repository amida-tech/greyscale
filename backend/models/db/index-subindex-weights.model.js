'use strict';

module.exports = function indexSubindexWeights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'IndexSubindexWeights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        indexId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        subindexId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        weight: {
            type: Sequelize.DOUBLE,
            allowNull: false,
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
