'use strict';

module.exports = function visualizations(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Visualizations';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        title: {
            type: Sequelize.STRING,
        },
        productId: {
            type: Sequelize.INTEGER,
        },
        topicIds: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
        },
        indexCollection: {
            type: Sequelize.STRING,
        },
        indexId: {
            type: Sequelize.INTEGER,
        },
        visualizationType: {
            type: Sequelize.STRING,
        },
        comparativeTopicId: {
            type: Sequelize.INTEGER,
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
