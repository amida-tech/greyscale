'use strict';

const chai = require('chai');
const session = require('supertest-session');
const _ = require('lodash');

const config = require('../../config');

var expect = chai.expect;

module.exports = class IndaSupertest {
    constructor() {
        this.server = null;
        this.baseAdminUrl = `/${config.pgConnect.adminSchema}/v0.2`;
        this.token = null;
    }

    initialize(app) {
        this.app = app;
        this.server = session(app);
        this.token = null;
    }

    authCommon(endpoint, user, status) {
        return this.server
            .get(endpoint)
            .auth(user.email, user.password)
            .expect(status)
            .then((res) => {
                const token = res.body.token;
                expect(!!token).to.equal(true);
                this.token = token;
            });
    }


    authAdminBasic(user, status = 200) {
        const endpoint = `${this.baseAdminUrl}/users/token`;
        return this.authCommon(endpoint, user, status);
    }

    authBasic(realm, user, status = 200) {
        const endpoint = `/${realm}/v0.2/users/token`;
        return this.authCommon(endpoint, user, status);
    }

    resetAuth() {
        this.server = session(this.app);
        this.token = null;
    }

    update(operation, base, endpoint, payload, status, header) {
        const r = this.server[operation](`${base}/${endpoint}`);
        if (this.token) {
            r.set('token', this.token);
        }
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    postAdmin(endpoint, payload, status, header) {
        return this.update('post', this.baseAdminUrl, endpoint, payload, status, header);
    }

    get(realm, endpoint, status, query) {
        let r = this.server.get(`/${realm}/v0.2/${endpoint}`);
        if (this.token) {
            r.set('token', this.token);
        }
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }

    post(realm, endpoint, payload, status, header) {
        const base  = `/${realm}/v0.2`;
        return this.update('post', base, endpoint, payload, status, header);
    }

    put(realm, endpoint, payload, status, header) {
        const base  = `/${realm}/v0.2`;
        return this.update('put', base, endpoint, payload, status, header);
    }

    delete(realm, endpoint, status) {
        const r = this.server.delete(`/${realm}/v0.2/${endpoint}`);
        if (this.token) {
            r.set('token', this.token);
        }
        return r.expect(status);
    }
};
