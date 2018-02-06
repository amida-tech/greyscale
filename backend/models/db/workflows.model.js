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
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        productId: {
            type: Sequelize.INTEGER,
            references: {
                model: {
                    schema,
                    tableName: 'Products',
                },
                key: 'id',
            },
            unique: true
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
