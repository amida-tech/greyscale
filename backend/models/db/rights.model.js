'use strict';

module.exports = function rights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Rights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        action: {
            type: Sequelize.STRING(80),
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
        },
        essenceId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Essences',
                },
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'Rights_action_idx',
            unique: true,
            fields: ['action'],
        }],
    });
};
