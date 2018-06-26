/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const config = require('../config');

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const organizationCommon = require('./util/organization-common');
const userCommon = require('./util/user-common');
const uoaCommon = require('./util/uoa-common');
const uoatypeCommon = require('./util/uoatype-common');

describe('uoa integration', function uoaTypeIntegration() {
    const dbname = 'indabatestuoa'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const uoaTypeTests = new uoatypeCommon.IntegrationTests(superTest);
    const tests = new uoaCommon.IntegrationTests(superTest, {
        hxUOAType: uoaTypeTests.hxUOAType,
        hxUser: userTests.hxUser,
    });

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

    it('add uoa type already loaded (hard coded in assumed sql)', function () {
        tests.hxUOAType.push({
            name: 'Country',
            langId: 1
        }, { id: 1});
    });

    it('login as admin', shared.loginFn(admin));

    it('create unit of analysis type', uoaTypeTests.createUOATypeFn());

    it('create unit of analysis', tests.createUOAFn(1, 0));

    it('get unit of analysis 0', tests.getUOAFn(0));

    it('list unit of analysis', tests.listUOAsFn());

    it('update unit of analysis 0', tests.updateUOAFn(0));

    it('get unit of analysis 0', tests.getUOAFn(0));

    it('list unit of analysis', tests.listUOAsFn());

    it('delete unit of analysid type 0', tests.deleteUOAFn(0));

    it('list unit of analysis', tests.listUOAsFn());

    it('logout as admin', shared.logoutFn());
});
