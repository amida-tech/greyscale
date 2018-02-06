'use strict';

module.exports = function indexQuestionWeights(sequelize, Sequelize, schema = 'public') {
    const tableName = 'IndexQuestionWeights';
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
