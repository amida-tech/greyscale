'use strict';

const chai = require('chai');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options={}) {
        this.supertest = supertest;
        this.hxUser = options.hxUser || new History();
        this.hxGroup = options.hxGroup;
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

    getUserFn(index) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        return function verifyUser() {
            const id = hxUser.id(index);
            return supertest.get(`users/${id}`, 200)
                .then((res) => {
                    const client = hxUser.client(index);
                    comparator.user(client, res.body);
                });
        }
    }

    updateUserGroupsFn(index, groupIndices) {
        const supertest = this.supertest;
        const hxUser = this.hxUser;
        const hxGroup = this.hxGroup;
        return function updateUserGroups() {
            const id = hxUser.id(index);
            const usergroupId = groupIndices.map((ndx) => hxGroup.id(ndx));
            return supertest.put(`users/${id}`, { usergroupId }, 202)
                .then(() => {
                    const client = hxUser.client(index);
                    client.usergroupId = usergroupId;
                });
        }
    }
};

module.exports = {
    IntegrationTests,
};
