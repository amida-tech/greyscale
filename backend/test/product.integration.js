/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const mock = require('mock-require');

mock('request-promise', function mockRequest() {
    return Promise.resolve({ statusCode: 200, body: { id: Math.floor(Math.random() * 100) + 1   } });
});

const config = require('../config');

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const userCommon = require('./util/user-common');
const organizationCommon = require('./util/organization-common');
const surveyCommon = require('./util/survey-common');
const productCommon = require('./util/product-common');
const examples = require('./fixtures/example/surveys');
const History = require('./util/History');
const AuthService = require('./util/mock_auth_service');

const legacy = _.cloneDeep(examples.legacy);

describe('product integration', function surveyIntegration() {
    const dbname = 'indabatestproduct'
    const authService = new AuthService();
    const hxGroup = new History();
    const superTest = new IndaSuperTest(authService);
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest, { hxGroup });
    const surveyTests = new surveyCommon.IntegrationTests(superTest);
    const tests = new productCommon.IntegrationTests(superTest, {
        hxSurvey: surveyTests.hxSurvey
    });

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;

    before(shared.setupFn({ dbname }));

    it('add super admin user and sign JWT',  function() {
        authService.addUser(superAdmin);
    });

    it('create organization without JWT', orgTests.createOrganizationWithNoJWTFn(organization));

    it('login as super user', shared.loginFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('get organization', orgTests.getOrganizationFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('add admin user and sign JWT',  function() {
        authService.addUser(admin);
    });

    it('login as admin', shared.loginFn(admin));

    it('organization admin checks activation token', userTests.checkActivitabilityFn(0));

    it('organization admin activates', userTests.selfActivateFn(0));

    it('create survey', surveyTests.createSurveyFn(legacy)); // INBA-889

    it('list products', tests.listProductsFn()); // INBA-889

    it('create product', tests.createProductFn(0));

    it('get product', tests.getProductFn(0)); // INBA-889

    it('list products', tests.listProductsFn()); // INBA-889

    it('logout as admin', shared.logoutFn());
});
