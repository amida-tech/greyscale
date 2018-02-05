'use strict';

module.exports = function productUoa(sequelize, Sequelize, schema = 'public') {
    const tableName = 'ProductUOA';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        UOAId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        currentStepId: {
            type: Sequelize.INTEGER,
        },
        isComplete: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isDeleted: {
            type: Sequelize.DATE(6),
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
