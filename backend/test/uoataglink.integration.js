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
const uoaCommon = require('./util/uoa-common');
const uoatypeCommon = require('./util/uoatype-common');
const uoataglinkCommon = require('./util/uoataglink-common');

describe('uoa tag link integration', function uoaTypeIntegration() {
    const dbname = 'indabatesttaglink'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const classTypeTests = new uoaclasstypeCommon.IntegrationTests(superTest);
    const tagTests = new uoatagCommon.IntegrationTests(superTest, classTypeTests.hxUOAClassType);
    const uoaTypeTests = new uoatypeCommon.IntegrationTests(superTest);
    const uoaTests = new uoaCommon.IntegrationTests(superTest, uoaTypeTests.hxUOAType, userTests.hxUser);
    const tests = new uoataglinkCommon.IntegrationTests(superTest, uoaTests.hxUOA, tagTests.hxUOATag);

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
        uoaTypeTests.hxUOAType.push({
            name: 'Country',
            langId: 1
        }, { id: 1});
    });

    it('login as admin', shared.loginFn(admin));

    it('create unit of analysis class type 0', classTypeTests.createUOAClassTypeFn());
    it('create unit of analysis class type 1', classTypeTests.createUOAClassTypeFn());

    it('create unit of analysis tag 0', tagTests.createUOATagFn(0));
    it('create unit of analysis tag 1', tagTests.createUOATagFn(1));
    it('create unit of analysis tag 2', tagTests.createUOATagFn(1));

    it('create unit of analysis type', uoaTypeTests.createUOATypeFn());
    it('create unit of analysis', uoaTests.createUOAFn(1, 0));

    it('create unit of analysis tag link 0', tests.createUOATagLinkFn(0, 0));
    it('create unit of analysis tag link 1', tests.createUOATagLinkFn(0, 1));

    it('list analysis tag links', tests.listUOATagLinksFn());

    it('delete unit of analysis tag 0', tests.deleteUOATagLinkFn(0));

    it('list analysis tag links', tests.listUOATagLinksFn());

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
