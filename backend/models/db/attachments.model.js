'use strict';

module.exports = function attachments(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Attachments';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        filename: {
            type: Sequelize.STRING,
        },
        size: {
            type: Sequelize.INTEGER,
        },
        mimetype: {
            type: Sequelize.STRING,
        },
        body: {
            type: Sequelize.BLOB,
        },
        created: {
            type: Sequelize.DATE(6),
        },
        owner: {
            type: Sequelize.INTEGER,
        },
        amazonKey: {
            type: Sequelize.STRING,
        },
   }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
