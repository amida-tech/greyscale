'use strict';

module.exports = function translations(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Translations';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        essenceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        entityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        field: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
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
