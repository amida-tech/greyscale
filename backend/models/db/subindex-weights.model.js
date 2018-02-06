'use strict';

module.exports = function subindexWeights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'SubindexWeights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        subindexId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Subindexes',
                },
                key: 'id',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        weight: {
            type: Sequelize.NUMERIC,
            allowNull: false,
        },
        type: {
            type: 'character varying',
            allowNull: false,
        }
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
