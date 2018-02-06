'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Tasks';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: 'character varying',
        },
        description: {
            type: Sequelize.TEXT,
        },
        uoaId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysis',
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
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Products',
                },
                key: 'id',
            },
        },
        startDate: {
            type: Sequelize.DATE,
        },
        endDate: {
            type: Sequelize.DATE,
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        langId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
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
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
