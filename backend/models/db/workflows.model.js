'use strict';

module.exports = function Workflows(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Workflows';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.STRING(200),
        },
        description: {
            type: Sequelize.TEXT,
        },
        created: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        productId: {
            type: Sequelize.INTEGER,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
