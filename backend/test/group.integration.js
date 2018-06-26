/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const config = require('../config');

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const organizationCommon = require('./util/organization-common');
const userCommon = require('./util/user-common');
const groupCommon = require('./util/group-common');
const History = require('./util/History');

describe('group integration', function uoaTypeIntegration() {
    const dbname = 'indabatestgroup'

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;

    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);

    const hxGroup = new History();
    const userTests = new userCommon.IntegrationTests(superTest, { hxGroup });

    const groupOptions = { hxOrganization: orgTests.hxOrganization, hxGroup };
    const tests = new groupCommon.IntegrationTests(superTest, groupOptions);

    const admin = config.testEntities.admin;
    const users = config.testEntities.users;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

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

    it('login as admin', shared.loginFn(admin));

    it('create group', tests.createGroupFn());

    it('get group 0', tests.getGroupFn(0));

    it('list groups', tests.listGroupsFn());

    it('update group 0', tests.updateGroupFn(0));

    it('get group 0', tests.getGroupFn(0));

    it('list groups', tests.listGroupsFn());

    it('delete group 0', tests.deleteGroupFn(0));

    it('list groups', tests.listGroupsFn());

    it('logout as admin', shared.logoutFn());
});
