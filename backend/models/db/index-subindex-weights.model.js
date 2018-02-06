'use strict';

module.exports = function indexSubindexWeights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'IndexSubindexWeights';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        indexId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: {
                    schema,
                    tableName: 'Indexes',
                },
                key: 'id',
            },
        },
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
        weight: {
            type: Sequelize.DOUBLE,
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
