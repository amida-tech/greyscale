'use strict';

module.exports = function projects(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Projects';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        organizationId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Organizations',
                },
                key: 'id',
            },
        },
        codeName: {
            type: Sequelize.STRING(100),
            unique: true,
        },
        description: {
            type: Sequelize.TEXT,
        },
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        matrixId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'AccessMatrices',
                },
                key: 'id',
            },
        },
        startTime: {
            type: Sequelize.DATE,
        },
        status: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        adminUserId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        closeTime: {
            type: Sequelize.DATE,
        },
        firstActivated: {
            type: Sequelize.DATE,
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
