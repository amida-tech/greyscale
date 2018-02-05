'use strict';

module.exports = function discussions(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Discussions';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        taskId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
        },
        entry: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        isReturn: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        created: {
            type: Sequelize.DATE(6),
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updated: {
            type: Sequelize.DATE(6),
         },
        isResolve: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        order: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
        returnTaskId: {
            type: Sequelize.INTEGER,
        },
        userFromId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        stepFromId: {
            type: Sequelize.INTEGER,
        },
        activated: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            allowNull: false,
        }
   }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
