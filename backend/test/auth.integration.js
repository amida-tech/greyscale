/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');


const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const IndaSuperTest = require('./util/inda-supertest');
const UserCommon = require('./util/user-common');
const OrganizationCommon = require('./util/organization-common');
const AuthCommon = require('./util/auth-common');
const History = require('./util/History');

describe('auth integration', function authIntegration() {
    const dbname = 'indabatestauth';
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new OrganizationCommon.IntegrationTests(superTest);
    const authTests = new AuthCommon.IntegrationTests(superTest);

    const hxGroup = new History();
    const userTests = new UserCommon.IntegrationTests(superTest, { hxGroup });

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    const users = config.testEntities.users;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('get organization', orgTests.getOrganizationFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('organization admin checks activation token', userTests.checkActivitabilityFn(0));

    it('organization admin activates', userTests.selfActivateFn(0));

    it('access restricted content without token', authTests.getUsersWithoutTokenFn());

    it('get invalid token with log in as admin', authTests.getBadTokenOnLoginFn(admin));

    it('access restricted route with invalid token', authTests.inviteUserWithInvalidTokenFn(users[0]));

    it('logout as admin', shared.logoutFn());

    it('get valid token with login as admin', shared.loginFn(admin));

    it('access restricted route with valid token', authTests.inviteUserWithValidTokenFn(users[0]));

    after(shared.unsetupFn());
});
