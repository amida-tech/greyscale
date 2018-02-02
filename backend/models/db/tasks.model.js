'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Tasks';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.TEXT,
        },
        uoaId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        startDate: {
            type: Sequelize.DATE,
        },
        endDate: {
            type: Sequelize.DATE,
        },
        userId: {
            type: Sequelize.INTEGER,
        },
        langId: {
            type: Sequelize.INTEGER,
        },
        assessmentId: {
            type: Sequelize.INTEGER,
        },
        userIds: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
        },
        groupIds: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
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
