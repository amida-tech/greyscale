'use strict';

module.exports = function attachmentAttempts(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AttachmentAttempts';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        key: {
            type: 'character varying',
            allowNull: false,
            primaryKey: true,
        },
        filename: {
            type: 'character varying',
            allowNull: false,
        },
        size: {
            type: Sequelize.INTEGER,
        },
        mimetype: {
            type: 'character varying',
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
