'use strict';

module.exports = function notifications(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Notifications';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userFrom: {
            type: Sequelize.INTEGER,
            onDelete: 'CASCADE',
            allowNull: false,
             references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        userTo: {
            type: Sequelize.INTEGER,
            allowNull: false,
            onDelete: 'CASCADE',
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        body: {
            type: Sequelize.TEXT,
        },
        email: {
            type: 'character varying',
        },
        message: {
            type: Sequelize.TEXT,
        },
        subject: {
            type: 'character varying',
        },
        essenceId: {
            type: Sequelize.INTEGER,
            onDelete: 'SET NULL',
            references: {
                model: {
                    schema,
                    tableName: 'Essences',
                },
                key: 'id',
            },
        },
        entityId: {
            type: Sequelize.INTEGER,
        },
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        reading: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
        },
        sent: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
        },
        read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        notifyLevel: {
            type: Sequelize.SMALLINT,
            defaultValue: 0,
        },
        result: {
            type: 'character varying',
        },
        resent: {
            type: Sequelize.DATE,
        },
        note: {
            type: Sequelize.TEXT,
        },
        userFromName: {
            type: 'character varying',
        },
        userToName: {
            type: 'character varying',
        },
   }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
