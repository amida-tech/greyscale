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
const workflowCommon = require('./util/workflow-common');
const groupCommon = require('./util/group-common');
const uoaCommon = require('./util/uoa-common');
const uoatypeCommon = require('./util/uoatype-common');
const taskCommon = require('./util/task-common');
const History = require('./util/History');
const AuthService = require('./util/mock_auth_service');

const examples = require('./fixtures/example/surveys');

const legacy = _.cloneDeep(examples.legacy);

describe('task integration with config authentication', function surveyIntegration() {
    const dbname = 'indabatesttaskdev'

    const authService = new AuthService();
    const superTest = new IndaSuperTest(authService);
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);

    const hxGroup = new History();
    const userTests = new userCommon.IntegrationTests(superTest, { hxGroup });

    const groupTests = new groupCommon.IntegrationTests(superTest, {
        hxOrganization: orgTests.hxOrganization,
        hxGroup,
    });

    const surveyTests = new surveyCommon.IntegrationTests(superTest);
    const productTests = new productCommon.IntegrationTests(superTest, {
        hxSurvey: surveyTests.hxSurvey,
    });

    const workflowTests = new workflowCommon.IntegrationTests(superTest, {
        hxSurvey: surveyTests.hxSurvey,
        hxProduct: productTests.hxProduct,
        hxGroup
    });

    const hxUOA = new History();
    const uoaTypeTests = new uoatypeCommon.IntegrationTests(superTest);
    const uoaTests = new uoaCommon.IntegrationTests(superTest, {
        hxUOAType: uoaTypeTests.hxUOAType,
        hxUser: userTests.hxUser,
        hxUOA,
    });

    const tests = new taskCommon.IntegrationTests(superTest, {
        hxProduct: productTests.hxProduct,
        hxUser: userTests.hxUser,
        hxWorkflowStep: workflowTests.hxWorkflowStep,
        hxUOA,
    });

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    const users = config.testEntities.users;

    before(shared.setupFn({ dbname }));

    it('add super admin user and sign JWT',  function() {
        authService.addUser(superAdmin)
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

    it('set token in config to emulate login', function emulateLogin() {
        config.devUserToken = superTest.token;
    });

    it('logout as admin', shared.logoutFn());

    _.range(2).forEach((index) => {
        it(`create group ${index}`, groupTests.createGroupFn());
    });

    users.forEach((user, index) => {
        it(`invite user ${index}`, userTests.inviteUserFn(user));
        it(`user ${index} activates`, userTests.selfActivateFn(index + 1));
    });

    it('create survey', surveyTests.createSurveyFn(legacy));
    it('create product', productTests.createProductFn(0));
    it(`create workflow`, workflowTests.createWorkflowFn(0));
    it('create workflow steps', workflowTests.createWorkflowStepsFn(0, {
        count: 4,
        groups: [[0, 1], null, null, [1]],
    }))

    it('add uoa type already loaded (hard coded in assumed sql)', function () {
        uoaTests.hxUOAType.push({
            name: 'Country',
            langId: 1
        }, { id: 1});
    });

    it('create unit of analysis type', uoaTypeTests.createUOATypeFn());

    it('create unit of analysis', uoaTests.createUOAFn(1, 0));

    it('create task 0', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 1, workflowIndex: 0, stepIndex: 0,
    }));
    it('create task 1', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 2, workflowIndex: 0, stepIndex: 1,
    }));
    it('create task 2', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 3, workflowIndex: 0, stepIndex: 2,
    }));
    it('create task 3', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 0, workflowIndex: 0, stepIndex: 3,
    }));

    it('reset config', function resetConfig() {
        config.devUserToken  = null;
    });
});
