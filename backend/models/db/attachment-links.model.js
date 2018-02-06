'use strict';

module.exports = function attachmentLinks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'AttachmentLinks';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        essenceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
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
            allowNull: false,
            primaryKey: true,
        },
        attachments: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
