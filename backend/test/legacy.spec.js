/* global describe,it*/

'use strict';

process.env.NODE_ENV = 'test';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const _ = require('lodash');

const pgUtil = require('./util/pg-util');
const config = require('../config');

describe('legacy tests', function bootstrapDb() {
    const dbname = 'indabatest'

    it(`drop/create database ${dbname}`, function resetDb(done) {
        const pgConnect = _.cloneDeep(config.pgConnect);
        pgConnect.database = 'indaba';
        pgUtil.resetDatabase(pgConnect, dbname, done);
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
