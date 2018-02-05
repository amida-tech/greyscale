'use strict';

module.exports = function indexes(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Indexes';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        productId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        title: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.TEXT,
        },
        divisor: {
            type: Sequelize.DOUBLE,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
