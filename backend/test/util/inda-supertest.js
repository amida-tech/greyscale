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
        this.authServiceUrl = "http://localhost:4000";
        this.token = null;
        this.realm = null;
    }

    initialize(app) {
        this.app = app;
        this.server = session(app);
        this.token = null;
    }

    authCommon(user, status, userId) {
        return this.server
            .post('http://localhost:4000/api/auth/login')
            .send(user)
            // .auth(user.email, user.password)
            .expect(status)
            .then((res) => {
                const token = res.body.token;
                expect(!!token).to.equal(true);
                this.token = 'Bearer '+ token;
                this.userId = userId;
            });
    }


    authAdminBasic(user, status = 200) {
        // const endpoint = `${this.baseAdminUrl}/users/token`;
        // const endpoint = `${this.authServiceUrl}/login`;
        return this.authCommon(user, status);
    }

    setRealm(realm) {
        this.realm = realm;
    }

    authBasic(user, status = 200, userId = null) {
        const endpoint = `/${this.realm}/v0.2/users/token`;
        return this.authCommon(endpoint, user, status, userId);
    }

    resetAuth() {
        this.server = session(this.app);
        this.token = null;
    }

    update(operation, base, endpoint, payload, status, header) {
        const r = this.server[operation](`${base}/${endpoint}`);
        if (this.token) {
            r.set('authorization', this.token);
        }
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    postAdmin(endpoint, payload, status, header) {
        return this.update('post', this.baseAdminUrl, endpoint, payload, status, header);
    }

    get(endpoint, status, query) {
        let r = this.server.get(`/${this.realm}/v0.2/${endpoint}`);
        if (this.token) {
            r.set('authorization', this.token);
        }
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }

    post(endpoint, payload, status, header) {
        const base  = `/${this.realm}/v0.2`;
        return this.update('post', base, endpoint, payload, status, header);
    }

    put(endpoint, payload, status, header) {
        const base  = `/${this.realm}/v0.2`;
        return this.update('put', base, endpoint, payload, status, header);
    }

    delete(endpoint, status) {
        const r = this.server.delete(`/${this.realm}/v0.2/${endpoint}`);
        if (this.token) {
            r.set('authorization', this.token);
        }
        return r.expect(status);
    }
};
