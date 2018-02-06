'use strict';

module.exports = function answerAttachments(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AnswerAttachments';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        answerId: {
            type: Sequelize.INTEGER,
        },
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
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        owner: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        amazonKey: {
            type: 'character varying',
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
