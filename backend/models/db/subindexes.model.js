'use strict';

module.exports = function subindexes(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Subindexes';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Products',
                },
                key: 'id',
            },
        },
        title: {
            type: 'character varying',
        },
        description: {
            type: Sequelize.TEXT,
        },
        divisor: {
            type: Sequelize.NUMERIC,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'Subindexes_productId_idx',
            fields: ['productId'],
        }],
    });
};
