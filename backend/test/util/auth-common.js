'use strict';

const chai = require('chai')
var expect = chai.expect;;
const _ = require('lodash');

const History = require('./history');
const comparator = require('./comparator');

const IndaSuperTest = require('../util/inda-supertest');


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

    inviteUserWithBadTokenFn(user) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function inviteUser() {
            return supertest.post('users/self/organization/invite', user, 401)
                    .then((res) => {
                    expect(res.statusCode).to.equal(401);
            hxUser.push(user, res.body);
        });
        }
    }
};

module.exports = {
    IntegrationTests
}
