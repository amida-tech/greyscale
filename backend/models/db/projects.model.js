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
        },
        description: {
            type: Sequelize.TEXT,
        },
        created: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW,
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
            type: 'timestamp(6) with time zone',
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
