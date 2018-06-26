/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const config = require('../config');

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const organizationCommon = require('./util/organization-common');
const userCommon = require('./util/user-common');
const uoaclasstypeCommon = require('./util/uoaclasstype-common');
const uoatagCommon = require('./util/uoatag-common');

describe('uoa class type integration', function uoaTypeIntegration() {
    const dbname = 'indabatestuoatag'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const classTypeTests = new uoaclasstypeCommon.IntegrationTests(superTest);
    const tests = new uoatagCommon.IntegrationTests(superTest, classTypeTests.hxUOAClassType);

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
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

    it('create unit of analysis tag', classTypeTests.createUOAClassTypeFn());

    it('create unit of analysis tag', tests.createUOATagFn(0));

    it('get unit of analysis tag 0', tests.getUOATagFn(0));

    it('list unit of analysis tag', tests.listUOATagsFn());

    it('update unit of analysis tag 0', tests.updateUOATagFn(0));

    it('get unit of analysis tag 0', tests.getUOATagFn(0));

    it('list unit of analysis tag', tests.listUOATagsFn());

    it('delete unit of analysis tag 0', tests.deleteUOATagFn(0));

    it('list unit of analysis tag', tests.listUOATagsFn());

    it('logout as admin', shared.logoutFn());
});
