'use strict';

module.exports = function unitOfAnalysis(sequelize, Sequelize, schema = 'public') {
    const tableName = 'UnitOfAnalysis';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        gadmId0: {
            type: Sequelize.SMALLINT,
        },
        gadmId1: {
            type: Sequelize.SMALLINT,
        },
        gadmId2: {
            type: Sequelize.SMALLINT,
        },
        gadmId3: {
            type: Sequelize.SMALLINT,
        },
        gadmObjectId: {
            type: Sequelize.INTEGER,
        },
        ISO: {
            type: Sequelize.STRING(3),
        },
        ISO2: {
            type: Sequelize.STRING(2),
        },
        nameISO: {
            type: Sequelize.STRING(100),
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(255),
        },
        shortName: {
            type: Sequelize.STRING(45),
        },
        HASC: {
            type: Sequelize.STRING(20),
        },
        unitOfAnalysisType: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'UnitOfAnalysisType',
                },
                key: 'id',
            },
        },
        parentId: {
            type: Sequelize.INTEGER,
        },
        creatorId: {
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
        ownerId: {
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
        visibility: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
        status: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
        created: {
            type: 'timestamp(6) with time zone',
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        isDeleted: {
            type: 'timestamp(6) with time zone',
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
        },
        updated: {
            type: 'timestamp(6) with time zone',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
