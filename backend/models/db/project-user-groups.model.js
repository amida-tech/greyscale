'use strict';

module.exports = function projectUserGroups(sequelize, Sequelize, schema = 'public') {
    const tableName = 'ProjectUserGroups';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Projects',
                },
                key: 'id',
            },
        },
        groupId: {
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
