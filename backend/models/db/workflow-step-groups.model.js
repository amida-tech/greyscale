'use strict';

module.exports = function workflowStepGroups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'WorkflowStepGroups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'WorkflowSteps',
                },
                key: 'id',
            },
        },
        groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Groups',
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
