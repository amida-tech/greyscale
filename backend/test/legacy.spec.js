/* global describe,it*/

'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const _ = require('lodash');

const pgUtil = require('./util/pg-util');
const config = require('../config');

describe('legacy tests', function bootstrapDb() {
    const dbname = 'indabatest'

    let pgConnect = null;

    it(`drop/create database ${dbname}`, function resetDb(done) {
        pgUtil.resetDatabase(config.pgConnect, dbname, done);
    });

    it(`form connection object for db ${dbname}`, function resetDb() {
        pgConnect = _.cloneDeep(config.pgConnect);
        pgConnect.database = dbname;
    });

    it(`initialize db ${dbname}`, function initDb() {
        const schemaPath = path.resolve(__dirname, '../db_setup/schema.indaba.sql');
        const dataPath = path.resolve(__dirname, '../db_setup/data.indaba.sql');
        const schemaSql = fs.readFileSync(schemaPath);
        const dataSql = fs.readFileSync(dataPath);
        childProcess.execSync(`psql -h localhost -U indabauser ${dbname}`, {
            input: schemaSql
        })
        childProcess.execSync(`psql -h localhost -U indabauser ${dbname}`, {
            input: dataSql
        })
    });
});
