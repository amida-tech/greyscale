'use strict';

module.exports = function discussions(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Discussions';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        taskId: {
            type: Sequelize.INTEGER,
            allowNull: false,
             references: {
                model: {
                    schema,
                    tableName: 'Tasks',
                },
                key: 'id',
            },
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
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        updated: {
            type: Sequelize.DATE,
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
            references: {
                model: {
                    schema,
                    tableName: 'Tasks',
                },
                key: 'id',
            },
        },
        userFromId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'WorkflowSteps',
                },
                key: 'id',
            },
        },
        stepFromId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'WorkflowSteps',
                },
                key: 'id',
            },
        },
        activated: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
   }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
