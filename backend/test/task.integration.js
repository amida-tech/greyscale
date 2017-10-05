/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

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

describe('task integration', function surveyIntegration() {
    const dbname = 'indabatesttask';

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

    it('add super admin user and sign JWT',  function() { authService.addUser(superAdmin) });

    it('login as super admin user', shared.loginFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('organization admin activates', userTests.selfActivateFn(0));

    it('add admin user and sign JWT',  function() { authService.addUser(admin) });

    it('login as admin', shared.loginFn(admin));

    _.range(2).forEach((index) => {
        it(`create group ${index}`, groupTests.createGroupFn());
    });

    users.forEach((user, index) => {
        it(`invite user ${index}`, userTests.inviteUserFn(user));
        it(`user ${index} activates`, userTests.selfActivateFn(index + 1));
    });

    it('create survey', surveyTests.createSurveyFn(legacy));

    _.range(2).forEach((index) => {
        it(`create product ${index}`, productTests.createProductFn(0));
        it(`create workflow ${index}`, workflowTests.createWorkflowFn(index));
        it(`create workflow ${index} steps`, workflowTests.createWorkflowStepsFn(index, {
            count: 4,
            groups: [[0, 1], null, null, [1]],
        }))
    });

    it('add uoa type already loaded (hard coded in assumed sql)', function () {
        uoaTests.hxUOAType.push({
            name: 'Country',
            langId: 1
        }, { id: 1});
    });

    it('create unit of analysis type', uoaTypeTests.createUOATypeFn());

    it('create unit of analysis', uoaTests.createUOAFn(1, 0));

    it('create product 0 task 0', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 1, workflowIndex: 0, stepIndex: 0,
    }));
    it('create product 0 task 1', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 2, workflowIndex: 0, stepIndex: 1,
    }));
    it('create product 0 task 2', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 3, workflowIndex: 0, stepIndex: 2,
    }));
    it('create product 0 task 3', tests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 0, workflowIndex: 0, stepIndex: 3,
    }));

    it('create product 1 task 0', tests.createTaskFn({
        productIndex: 1, uoaIndex: 0, userIndex: 1, workflowIndex: 1, stepIndex: 0,
    }));
    it('create product 1 task 2', tests.createTaskFn({
        productIndex: 1, uoaIndex: 0, userIndex: 3, workflowIndex: 1, stepIndex: 2,
    }));

    _.range(4).forEach((index) => {
        it(`get task ${index}`, tests.getTaskFn(index));
    });

    it(`list tasks`, tests.listTasksFn());

    _.range(2).forEach((index) => {
        it(`list product tasks`, tests.listProductTasksFn(index));
    });

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
