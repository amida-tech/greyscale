'use strict';

const Sequelize = require('sequelize');
const types = require('pg').types;

const functions = require('./functions');

types.setTypeParser(1184, value => value);

const enums = [{
    name: 'event_status',
    values: [
        'New',
        'Submitted', 'Approved',
        'Rejected',
        'Deleted',
        'Active',
        'Inactive',
    ],
}, {
    name: 'order_status',
    values: [
        'New',
        'Acknowledged',
        'Confirmed',
        'Fulfilled',
        'Cancelled',
    ],
}, {
    name: 'tour_status',
    values: [
        'New',
        'Submitted',
        'Approved',
        'Active',
        'Inactive',
        'Deleted',
        'Rejected',
    ],
}, {
    name: 'transport_status',
    values: [
        'New',
        'Submitted',
        'Approved',
        'Available',
        'Rented',
        'Deleted',
    ],
}];

const createEnum = function (spec) {
    const values = spec.values.map(r => `'${r}'`).join(', ');
    const name = spec.name;
    return `CREATE TYPE ${name} AS ENUM (${values});`;
};

const dropEnum = function (spec) {
    return `DROP TYPE IF EXISTS ${spec.name}`;
};

module.exports = function sequelizeGenerator(config, schemas) {
    const sequelizeOptions = {
        host: config.host,
        dialect: 'postgres',
        native: false,
        dialectOptions: {
            ssl: !!config.ssl,
        },
        port: config.port,
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
        },
        logging: false,
        operatorsAliases: false,
    };

    const { database, user, password } = config;
    const sequelize = new Sequelize(database, user, password, sequelizeOptions);

    sequelize.addHook('beforeBulkSync', function addHook(options) {
        if (options.force) {
            return sequelize.dropAllSchemas()
                .then(() => {
                    const pxs = enums.map(spec => sequelize.query(dropEnum(spec)));
                    return Promise.all(pxs);
                })
                .then(() => {
                    const pxs = schemas.map(schema => this.createSchema(schema));
                    return Promise.all(pxs);
                })
                .then(() => {
                    const pxs = enums.map(spec => sequelize.query(createEnum(spec)));
                    return Promise.all(pxs);
                })
                .then(() => {
                    const pxsAll = ['public', ...schemas].map((schema) => {
                        const pxs = functions.map((r) => {
                            const fn = r.replace(/:rschema/g, schema);
                            return sequelize.query(fn);
                        });
                        return Promise.all(pxs);
                    });
                    return Promise.all(pxsAll);
                });
        }
        return null;
    });

    return { Sequelize, sequelize };
};
