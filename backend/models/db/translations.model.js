'use strict';

module.exports = function translations(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Translations';
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
        field: {
            type: Sequelize.STRING(100),
            allowNull: false,
            primaryKey: true,
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Languages',
                },
                key: 'id',
            },
        },
        value: {
            type: Sequelize.TEXT,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
