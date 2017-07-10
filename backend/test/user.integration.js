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
    const dbname = 'indabatest'
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

    it('get organization', function getOrganization() {
        const realm = organization.realm;
        return superTest.get(realm, `organizations/${orgId}`, 200)
            .then((res) => {
                const expected = Object.assign({ id: orgId }, organization);
                const actual = _.pick(res.body, ['id', 'realm', 'name']);
                expect(actual).to.deep.equal(expected);
            });
    });

    let activationToken;

    it('invite organization admin', function inviteAdmin() {
        const realm = organization.realm;
        return superTest.post(realm, 'users/self/organization/invite', admin, 200)
            .then((res) => {
                expect(!!res.body.activationToken).to.equal(true);
                activationToken = res.body.activationToken;
            });
    });

    it('logout as super user', shared.logoutFn());

    it('organization admin checks activation token', function adminSelfActivateCheck() {
        const realm = organization.realm;
        return superTest.get(realm, `users/activate/${activationToken}`, 200);
    })

    it('organization admin activates', function adminSelfActivate() {
        const realm = organization.realm;
        return superTest.post(realm, `users/activate/${activationToken}`, admin, 200);
    })

    it('login as admin', shared.loginFn(organization.realm, admin));

    const userActivationTokens = [];

    users.forEach((user, index) => {
        it(`invite user ${index}`, function inviteUser() {
            const realm = organization.realm;
            return superTest.post(realm, 'users/self/organization/invite', user, 200)
                .then((res) => {
                    expect(!!res.body.activationToken).to.equal(true);
                    userActivationTokens.push(res.body.activationToken);
                });
        });
    });

    it('logout as admin', shared.logoutFn());

    users.forEach((user, index) => {
        it(`user ${index} activates`, function userActivate() {
            const realm = organization.realm;
            const token = userActivationTokens[index];
            return superTest.post(realm, `users/activate/${token}`, user, 200);
        })

        it(`login as user ${index}`, shared.loginFn(organization.realm, user));

        it(`logout as user ${index}`, shared.logoutFn());
    });

    after(shared.unsetupFn());
});
