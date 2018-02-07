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
        roleID: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Roles',
                },
                key: 'id',
            },
        },
        email: {
            type: Sequelize.STRING(80),
            allowNull: false,
            unique: true,
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
            type: Sequelize.DATEONLY,
        },
        resetPasswordToken: {
            type: Sequelize.STRING(100),
        },
        resetPasswordExpires: {
            type: Sequelize.BIGINT,
        },
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
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
        affiliation: {
            type: 'character varying',
        },
        isAnonymous: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        salt: {
            type: 'character varying',
        },
        authId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        isDeleted: {
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'Users_roleID_idx',
            fields: ['roleID'],
        }],
        hooks: {
            afterSync(options) {
                if (options.force) {
                    if (schema === 'public') {
                        return sequelize.query('CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update()');
                    }
                }
                return null;
            },
        },
    });
};
