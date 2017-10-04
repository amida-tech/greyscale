/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const IndaSuperTest = require('./util/inda-supertest');
const organizationCommon = require('./util/organization-common');
const userCommon = require('./util/user-common');
const groupCommon = require('./util/group-common');
const History = require('./util/History');
const AuthService = require('./util/mock_auth_service');

describe('user integration', function userIntegration() {
    const dbname = 'indabatestuser';

    const authService = new AuthService();
    const superTest = new IndaSuperTest(authService);
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);

    const hxGroup = new History();
    const userTests = new userCommon.IntegrationTests(superTest, { hxGroup });

    const groupOptions = { hxOrganization: orgTests.hxOrganization, hxGroup };
    const groupTests = new groupCommon.IntegrationTests(superTest, groupOptions);

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    const users = config.testEntities.users;


    before(shared.setupFn({ dbname }));

    it('add super admin user and sign JWT',  function() { authService.addUser(superAdmin) });

    it('create organization without JWT', orgTests.createOrganizationWithNoJWTFn(organization));

    it('login as super user', shared.loginFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('get organization', orgTests.getOrganizationFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('add admin user and sign JWT',  function() { authService.addUser(admin) });

    it('login as super user', shared.loginFn(admin));

    it('organization admin checks activation token', userTests.checkActivitabilityFn(0));

    it('organization admin activates', userTests.selfActivateFn(0));

    users.forEach((user, index) => {
        it(`invite user ${index}`, userTests.inviteUserFn(user));
    });

    it('logout as admin', shared.logoutFn());

    users.forEach((user, index) => {
        it(`user ${index} activates`, userTests.selfActivateFn(index + 1));

        it(`add user and sign JWT ${index}`, function() { authService.addUser(user) });

        it(`login as user ${index}`, shared.loginFn(user));

        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('create group without JWT', groupTests.createGroupWithOutJWTFn());

    it('login as admin', shared.loginFn(admin));

    _.range(4).forEach((index) => {
        it(`create group ${index}`, groupTests.createGroupFn());
    });

    it('assign user 1 groups 0, 2', userTests.updateUserGroupsFn(1, [0, 2]));
    it('assign user 2 groups 1, 2', userTests.updateUserGroupsFn(2, [1, 2]));

    it('verify user 1', userTests.getUserFn(1));
    it('verify user 2', userTests.getUserFn(2));

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
