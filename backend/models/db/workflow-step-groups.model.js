'use strict';

module.exports = function workflowStepGroups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'WorkflowStepGroups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        groupId: {
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
