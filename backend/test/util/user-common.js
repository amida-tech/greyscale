'use strict';

const chai = require('chai');

const History = require('./history');

const expect = chai.expect;

const IntegrationTests = class IntegrationTests {
    constructor(supertest) {
        this.supertest = supertest;
        this.hxUser = new History();
    }

    inviteUserFn(user) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function inviteUser() {
            return supertest.post('users/self/organization/invite', user, 200)
                .then((res) => {
                    expect(!!res.body.activationToken).to.equal(true);
                    hxUser.push(user, res.body);
                });
        }
    }

    checkActivitabilityFn(index) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function checkActivitability() {
            const activationToken = hxUser.server(index).activationToken;
            return supertest.get(`users/activate/${activationToken}`, 200);
        };
    }

    selfActivateFn(index) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function selfActivate() {
            const activationToken = hxUser.server(index).activationToken;
            const client = hxUser.client(index);
            return supertest.post(`users/activate/${activationToken}`, client, 200)
                .then((res) => {
                    hxUser.server(index).id = res.body.id;
                });
        };
    }
};

module.exports = {
    IntegrationTests,
};
