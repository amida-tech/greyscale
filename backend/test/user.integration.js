/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const expect = chai.expect;

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');

describe('user integration', function userIntegration() {
    const dbname = 'indabatestuser'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    const users = config.testEntities.users;
    let orgId;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', function createOrganization() {
        return superTest.postAdmin('organizations', organization, 201)
            .then((res) => {
                orgId = res.body.id;
            });
    });

    it('set realm', function setAdminRealm() {
        superTest.setRealm(organization.realm);
    });

    it('get organization', function getOrganization() {
        return superTest.get(`organizations/${orgId}`, 200)
            .then((res) => {
                const expected = Object.assign({ id: orgId }, organization);
                const actual = _.pick(res.body, ['id', 'realm', 'name']);
                expect(actual).to.deep.equal(expected);
            });
    });

    let activationToken;

    it('invite organization admin', function inviteAdmin() {
        return superTest.post('users/self/organization/invite', admin, 200)
            .then((res) => {
                expect(!!res.body.activationToken).to.equal(true);
                activationToken = res.body.activationToken;
            });
    });

    it('logout as super user', shared.logoutFn());

    it('organization admin checks activation token', function adminSelfActivateCheck() {
        return superTest.get(`users/activate/${activationToken}`, 200);
    })

    it('organization admin activates', function adminSelfActivate() {
        return superTest.post(`users/activate/${activationToken}`, admin, 200);
    })

    it('login as admin', shared.loginFn(admin));

    const userActivationTokens = [];

    users.forEach((user, index) => {
        it(`invite user ${index}`, function inviteUser() {
            return superTest.post('users/self/organization/invite', user, 200)
                .then((res) => {
                    expect(!!res.body.activationToken).to.equal(true);
                    userActivationTokens.push(res.body.activationToken);
                });
        });
    });

    it('logout as admin', shared.logoutFn());

    users.forEach((user, index) => {
        it(`user ${index} activates`, function userActivate() {
            const token = userActivationTokens[index];
            return superTest.post(`users/activate/${token}`, user, 200);
        })

        it(`login as user ${index}`, shared.loginFn(user));

        it(`logout as user ${index}`, shared.logoutFn());
    });

    after(shared.unsetupFn());
});
