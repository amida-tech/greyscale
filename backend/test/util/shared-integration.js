'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const _ = require('lodash');
const sinon = require('sinon');

const appGenerator = require('../../app/app-generator');

const pgUtil = require('./pg-util');
const config = require('../../config');
const memcacheMock = require('./memcache-mock')

class SharedIntegration {
    constructor(indaSuperTest, hxUser) {
        this.indaSuperTest = indaSuperTest;
        this.hxUser = hxUser;
    }

    setupFn(options) {
        const indaSuperTest = this.indaSuperTest;
        const mcl = new memcacheMock.Client();
        return function setUp(done) {
            const dbname = options.dbname;
            config.pgConnect.database = dbname;
            const pgConnect = _.cloneDeep(config.pgConnect);
            pgConnect.database = 'indaba';
            pgUtil.resetDatabase(pgConnect, dbname, (err) => {
                if (err) {
                    return done(err);
                }
                const schemaPath = path.resolve(__dirname, '../../db_setup/schema.indaba.sql');
                const dataPath = path.resolve(__dirname, '../../db_setup/data.indaba.sql');
                const schemaSql = fs.readFileSync(schemaPath);
                const dataSql = fs.readFileSync(dataPath);
                childProcess.execSync(`psql -h localhost -U indabauser ${dbname}`, {
                    input: schemaSql
                })
                childProcess.execSync(`psql -h localhost -U indabauser ${dbname}`, {
                    input: dataSql
                })
                const app = appGenerator.generate();
                const mcClient = app.locals.mcClient;
                sinon.stub(mcClient, 'set').callsFake((key, value, cb) => mcl.set(key, value, cb));
                sinon.stub(mcClient, 'get').callsFake((key, cb) => mcl.get(key, cb));
                sinon.stub(mcClient, 'delete').callsFake((key, cb) => mcl.delete(key, cb));
                indaSuperTest.initialize(app);
                done();
            });
        };
    }

    loginFn(user) {
        const indaSuperTest = this.indaSuperTest;
        return function login() {
            return indaSuperTest.authCommon(user);
        };
    }

    loginIndexFn(userIndex) {
        const that = this;
        return function loginIndex() {
            const user = that.hxUser.client(userIndex);
            const id = that.hxUser.id(userIndex);
            return that.indaSuperTest.authCommon(user);
        };
    }

    logoutFn() {
        const indaSuperTest = this.indaSuperTest;
        return function logout() {
            indaSuperTest.resetAuth();
        };
    }

    unsetupFn() {
        const indaSuperTest = this.indaSuperTest;
        return function unsetup() {
            const mcClient = indaSuperTest.app.locals.mcClient;
            mcClient.set.restore();
            mcClient.get.restore();
            mcClient.delete.restore();
        }
    }
}

module.exports = SharedIntegration;
