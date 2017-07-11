/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const expect = chai.expect;

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const userCommon = require('./util/user-common');

describe('user integration', function userIntegration() {
    const dbname = 'indabatestuser'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);

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

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('organization admin checks activation token', userTests.checkActivitabilityFn(0));

    it('organization admin activates', userTests.selfActivateFn(0));

    it('login as admin', shared.loginFn(admin));

    users.forEach((user, index) => {
        it(`invite user ${index}`, userTests.inviteUserFn(user));
    });

    it('logout as admin', shared.logoutFn());

    users.forEach((user, index) => {
        it(`user ${index} activates`, userTests.selfActivateFn(index + 1));

        it(`login as user ${index}`, shared.loginFn(user));

        it(`logout as user ${index}`, shared.logoutFn());
    });

    after(shared.unsetupFn());
});
