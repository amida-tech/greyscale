'use strict';

module.exports = function visualizations(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Visualizations';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: 'character varying',
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
        },
        topicIds: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
        },
        indexCollection: {
            type: 'character varying',
        },
        indexId: {
            type: Sequelize.INTEGER,
        },
        visualizationType: {
            type: 'character varying',
        },
        comparativeTopicId: {
            type: Sequelize.INTEGER,
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Organizations',
                },
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
