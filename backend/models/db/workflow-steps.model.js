'use strict';

module.exports = function workflowSteps(sequelize, Sequelize, schema = 'public') {
    const tableName = 'WorkflowSteps';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        workflowId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        startDate: {
            type: Sequelize.DATE,
        },
        endDate: {
            type: Sequelize.DATE,
        },
        title: {
            type: Sequelize.STRING,
        },
        provideResponses: {
            type: Sequelize.BOOLEAN,
        },
        discussionParticipation: {
            type: Sequelize.BOOLEAN,
        },
        blindReview: {
            type: Sequelize.BOOLEAN,
        },
        seeOthersResponses: {
            type: Sequelize.BOOLEAN,
        },
        allowTranslate: {
            type: Sequelize.BOOLEAN,
        },
        position: {
            type: Sequelize.INTEGER,
        },
        writeToAnswers: {
            type: Sequelize.BOOLEAN,
        },
        allowEdit: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        role: {
            type: Sequelize.STRING,
        },
        langId: {
            type: Sequelize.INTEGER,
        },
        isDeleted: {
            type: Sequelize.DATE(6),
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
