'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Users';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        roleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
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
            type: Sequelize.DATE(6),
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
        organizationId: {
            type: Sequelize.INTEGER,
        },
        location: {
            type: Sequelize.STRING,
        },
        phone: {
            type: Sequelize.STRING,
        },
        address: {
            type: Sequelize.STRING,
        },
        lang: {
            type: Sequelize.STRING,
        },
        bio: {
            type: Sequelize.TEXT,
        },
        notifyLevel: {
            type: Sequelize.SMALLINT,
        },
        timezone: {
            type: Sequelize.STRING,
        },
        lastActive: {
            type: Sequelize.DATE,
        },
        timezone: {
            type: Sequelize.STRING,
        },
        affiliation: {
            type: Sequelize.STRING,
        },
        isAnonymous: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        salt: {
            type: Sequelize.STRING,
        },
        authId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        isDeleted: {
            type: Sequelize.DATE(6),
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
