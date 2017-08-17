'use strict';

const chai = require('chai')
var expect = chai.expect;;
const _ = require('lodash');

const History = require('./history');
const comparator = require('./comparator');

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options={}) {
        this.supertest = supertest;
        this.token = null;
        this.hxUser = options.hxUser || new History();
        this.hxGroup = options.hxGroup;
    }

    getBadTokenOnLoginFn(user) {
        const supertest = this.supertest;
        return function getBadTokenOnLogin() {
            return supertest.get('users/token', 200)
                .auth(user.email, user.password)
                .then((res) => {
                    const token = 'badToken';
                    expect(!!token).to.equal(true);
                    this.token = 'JWT '+ token;
            });
        };
    }

    inviteUserWithInvalidTokenFn(user) {
        const supertest = this.supertest;
        return function inviteUser() {
            return supertest.post('users/self/organization/invite', user, 401)
                .then((res) => {
                    expect(res.statusCode).to.equal(401);
                });
        };
    }

    inviteUserWithValidTokenFn(user) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function inviteUser() {
            return supertest.post('users/self/organization/invite', user, 200)
                .then((res) => {
                    expect(!!res.body.activationToken).to.equal(true);
                    hxUser.push(user, res.body);
                });
        };
    }

    getUsersWithoutTokenFn() {
        const supertest = this.supertest;
        return function getUsers() {
            return supertest.get('users', 401)
                .then((res) => {
                    expect(res.statusCode).to.equal(401);
                });
        }
    }
};

module.exports = {
    IntegrationTests
}
