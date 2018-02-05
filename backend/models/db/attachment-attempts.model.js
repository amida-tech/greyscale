'use strict';

module.exports = function attachmentAttempts(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AttachmentAttempts';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        key: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        filename: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        size: {
            type: Sequelize.INTEGER,
        },
        mimetype: {
            type: Sequelize.STRING,
        },
        created: {
            type: Sequelize.DATE,
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
