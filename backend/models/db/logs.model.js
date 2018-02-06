'use strict';

module.exports = function tasks(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Logs';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        created: {
            type: 'timestamp(6) with time zone',
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        userid: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Users',
                },
                key: 'id',
            },
        },
        action: {
            type: 'character varying',
        },
        essence: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'Essences',
                },
                key: 'id',
            },
        },
        entity: {
            type: Sequelize.INTEGER,
        },
        entities: {
            type: 'character varying',
        },
        quantity: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        info: {
            type: Sequelize.TEXT,
        },
        error: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        result: {
            type: 'character varying',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
    });
};
