'use strict';

module.exports = function attachments(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Attachments';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        filename: {
            type: 'character varying',
        },
        size: {
            type: Sequelize.INTEGER,
        },
        mimetype: {
            type: 'character varying',
        },
        body: {
            type: Sequelize.BLOB,
        },
        created: {
            type: Sequelize.DATE,
        },
        owner: {
            type: Sequelize.INTEGER,
        },
        amazonKey: {
            type: 'character varying',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
