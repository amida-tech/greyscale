'use strict';

module.exports = function essences(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Essences';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        tableName: {
            type: Sequelize.STRING(100),
            unique: true,
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        fileName: {
            type: Sequelize.STRING(100),
            unique: true,
        },
        nameField: {
            type: 'character varying',
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'Essences_upper_idx',
            unique: true,
            fields: [sequelize.literal('upper((name)::text)')],
        }],
    });
};
