'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Users';
    const modelName = `${schema}_${tableName}`;

    const organizationId = {
        type: Sequelize.INTEGER,
    };

    if (schema !== 'public') {
        organizationId.references = {
            model: {
                schema,
                tableName: 'Organizations',
            },
            key: 'id',
        };
    }

    return sequelize.define(modelName, {
        roleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Roles',
                },
                key: 'id',
            },
            unique: true,
        },
        email: {
            type: Sequelize.STRING(80),
            allowNull: false,
        },
        firstName: {
            type: Sequelize.STRING(80),
            allowNull: false,
        },
        lastName: {
            type: Sequelize.STRING(80),
        },
        password: {
            type: Sequelize.STRING(200),
            allowNull: false,
        },
        cell: {
            type: Sequelize.STRING(20),
        },
        birthday: {
            type: Sequelize.DATE,
        },
        resetPasswordToken: {
            type: Sequelize.STRING(100),
        },
        resetPasswordExpires: {
            type: Sequelize.BIGINT,
        },
        created: {
            type: 'timestamp(6) with time zone',
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updated: {
            type: Sequelize.DATE,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
        },
        activationToken: {
            type: Sequelize.STRING(100),
        },
        organizationId,
        location: {
            type: 'character varying',
        },
        phone: {
            type: 'character varying',
        },
        address: {
            type: 'character varying',
        },
        lang: {
            type: 'character varying',
        },
        bio: {
            type: Sequelize.TEXT,
        },
        notifyLevel: {
            type: Sequelize.SMALLINT,
        },
        timezone: {
            type: 'character varying',
        },
        lastActive: {
            type: Sequelize.DATE,
        },
        timezone: {
            type: 'character varying',
        },
        affiliation: {
            type: 'character varying',
        },
        isAnonymous: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
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
        salt: {
            type: 'character varying',
        },
        authId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        isDeleted: {
            type: 'timestamp(6) with time zone',
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
