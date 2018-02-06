'use strict';

module.exports = function notifications(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Notifications';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userFrom: {
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
        userTo: {
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
            type: 'timestamp(6) with time zone',
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        reading: {
            type: 'timestamp(6) with time zone',
            defaultValue: Sequelize.NOW,
        },
        sent: {
            type: 'timestamp(6) with time zone',
            defaultValue: Sequelize.NOW,
        },
        read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        notifyLevel: {
            type: Sequelize.SMALLINT,
            defaultValue: 1,
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
