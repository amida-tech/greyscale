'use strict';

const chai = require('chai');
const session = require('supertest-session');
const _ = require('lodash');

const config = require('../../config');
const AuthService = require('../util/mock_auth_service');

module.exports = class IndaSupertest {
    constructor(authService) {
        this.baseAdminUrl = `/${config.pgConnect.adminSchema}/v0.2`;
        this.realm = null;
        this.authService = authService;
    }

    initialize(app) {
        this.app = app;
        this.server = session(app);
        this.token = null;
    }

    authCommon(user) {
        const token = this.authService.getJWT(user);
        if (token) {
            this.token = 'Bearer ' + token;
        } else {
            throw new Error('Login failed');
        }
    }

    setRealm(realm) {
        this.realm = realm;
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
