'use strict';

module.exports = function notifications(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Notifications';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userFrom: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        userTo: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        body: {
            type: Sequelize.TEXT,
        },
        email: {
            type: Sequelize.STRING,
        },
        message: {
            type: Sequelize.TEXT,
        },
        subject: {
            type: Sequelize.STRING,
        },
        essenceId: {
            type: Sequelize.INTEGER,
        },
        entityId: {
            type: Sequelize.INTEGER,
        },
        created: {
            type: Sequelize.DATE(6),
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        reading: {
            type: Sequelize.DATE(6),
            defaultValue: Sequelize.NOW,
        },
        sent: {
            type: Sequelize.DATE(6),
            defaultValue: Sequelize.NOW,
        },
        read: {
            type: Sequelize.BOOLEAN,
        },
        notifyLevel: {
            type: Sequelize.INTEGER,
        },
        result: {
            type: Sequelize.STRING,
        },
        resent: {
            type: Sequelize.DATE,
        },
        note: {
            type: Sequelize.TEXT,
        },
        userFromName: {
            type: Sequelize.STRING,
        },
        userToName: {
            type: Sequelize.STRING,
        },
   }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
