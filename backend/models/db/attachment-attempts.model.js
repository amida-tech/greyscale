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
        },
        mimetype: {
            type: 'character varying',
        },
        size: {
            type: Sequelize.INTEGER,
        },
        created: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
