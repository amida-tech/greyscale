'use strict';

module.exports = function productUoa(sequelize, Sequelize, schema = 'public') {
    const tableName = 'ProductUOA';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Products',
                },
                key: 'id',
            },
        },
        UOAId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysis',
                },
                key: 'id',
            },
        },
        currentStepId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'WorkflowSteps',
                },
                key: 'id',
            },
        },
        isComplete: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isDeleted: {
            type: Sequelize.DATE,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
