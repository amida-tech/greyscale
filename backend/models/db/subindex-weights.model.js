'use strict';

module.exports = function subindexWeights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'SubindexWeights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        subindexId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        questionId: {
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
