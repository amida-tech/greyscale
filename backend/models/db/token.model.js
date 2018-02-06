'use strict';

module.exports = function tokens(sequelize, Sequelize, schema = 'public') {
    const tableName = 'Token';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        body: {
            type: Sequelize.STRING(200),
            allowNull: false,
            unique: true,
        },
        issuedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('now()'),
        },
        realm: {
            type: Sequelize.STRING(80),
            allowNull: false,
            primaryKey: true,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{
            name: 'Token_body_idx',
            unique: true,
            fields: ['body'],
        }],
        hooks: {
            afterSync(options) {
                if (options.force) {
                    if (schema === 'public') {
                        return sequelize.query('CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token()');
                    }
                }
                return null;
            },
        },
    });
};
