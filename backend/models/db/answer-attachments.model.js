'use strict';

module.exports = function answerAttachments(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AnswerAttachments';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        answerId: {
            type: Sequelize.INTEGER,
        },
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
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        owner: {
            type: Sequelize.INTEGER,
        },
        amazonKey: {
            type: Sequelize.STRING,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
