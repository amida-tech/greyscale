/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const config = require('../config');

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const organizationCommon = require('./util/organization-common');
const userCommon = require('./util/user-common');
const uoatypeCommon = require('./util/uoatype-common');

describe('uoa type integration', function uoaTypeIntegration() {
    const dbname = 'indabatestuoatype';
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const tests = new uoatypeCommon.IntegrationTests(superTest);

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

    it('add uoa type already loaded (hard coded in assumed sql)', function () {
        tests.hxUOAType.push({
            name: 'Country',
            langId: 1
        }, { id: 1});
    });

    it('login as admin', shared.loginFn(admin));

    it('create unit of analysis type', tests.createUOATypeFn());

    it('get unit of analysis type 0', tests.getUOATypeFn(0));

    it('get unit of analysis type 1', tests.getUOATypeFn(1));

    it('list unit of analysis type', tests.listUOATypesFn());

    it('update unit of analysis type 1', tests.updateUOATypeFn(1));

    it('get unit of analysis type 1', tests.getUOATypeFn(1));

    it('list unit of analysis type', tests.listUOATypesFn());

    it('delete unit of analysid type 1', tests.deleteUOATypeFn(1));

    it('list unit of analysis type', tests.listUOATypesFn());

    it('logout as admin', shared.logoutFn());
});
