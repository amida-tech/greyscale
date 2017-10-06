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
const discussionCommon = require('./util/discussion-common');
const History = require('./util/History');
const AuthService = require('./util/mock_auth_service');

const examples = require('./fixtures/example/surveys');

const legacy = _.cloneDeep(examples.legacy);

describe('discussion integration', function surveyIntegration() {
    const dbname = 'indabatestdiscussion';

    const authService = new AuthService();
    const hxUser = new History();
    const superTest = new IndaSuperTest(authService);
    const shared = new SharedIntegration(superTest, hxUser);
    const orgTests = new organizationCommon.IntegrationTests(superTest);

    const hxGroup = new History();
    const hxSurvey = new History();
    const hxQuestion = new History();
    const hxUOA = new History();
    const userTests = new userCommon.IntegrationTests(superTest, { hxUser, hxGroup });

    const groupTests = new groupCommon.IntegrationTests(superTest, {
        hxOrganization: orgTests.hxOrganization,
        hxGroup,
    });

    const surveyTests = new surveyCommon.IntegrationTests(superTest, {
        hxSurvey,
        hxQuestion
    });
    const productTests = new productCommon.IntegrationTests(superTest, {
        hxSurvey: surveyTests.hxSurvey,
        hxUOA,
    });

    const workflowTests = new workflowCommon.IntegrationTests(superTest, {
        hxSurvey,
        hxProduct: productTests.hxProduct,
        hxGroup
    });

    const uoaTypeTests = new uoatypeCommon.IntegrationTests(superTest);
    const uoaTests = new uoaCommon.IntegrationTests(superTest, {
        hxUOAType: uoaTypeTests.hxUOAType,
        hxUser: userTests.hxUser,
        hxUOA,
    });

    const taskTests = new taskCommon.IntegrationTests(superTest, {
        hxProduct: productTests.hxProduct,
        hxUser: userTests.hxUser,
        hxWorkflowStep: workflowTests.hxWorkflowStep,
        hxUOA,
    });

    const tests = new discussionCommon.IntegrationTests(superTest, {
        hxQuestion,
        hxTask: taskTests.hxTask,
        hxWorkflowStep: workflowTests.hxWorkflowStep,
        hxProduct: productTests.hxProduct,
    });

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    const users = config.testEntities.users;

    before(shared.setupFn({ dbname }));

    it('add super admin user and sign JWT',  function() { authService.addUser(superAdmin) });

    it('login as super user', shared.loginFn(superAdmin));

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
            groups: [[1], [1], [1], [1]],
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

    it('create product 0 task 0', taskTests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 1, workflowIndex: 0, stepIndex: 0,
    }));
    it('create product 0 task 1', taskTests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 2, workflowIndex: 0, stepIndex: 1,
    }));
    it('create product 0 task 2', taskTests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 3, workflowIndex: 0, stepIndex: 2,
    }));
    it('create product 0 task 3', taskTests.createTaskFn({
        productIndex: 0, uoaIndex: 0, userIndex: 0, workflowIndex: 0, stepIndex: 3,
    }));

    it('add product 0 uoa 0 link', productTests.addUOAFn({ index: 0, uoaIndex: 0 } ));

    it('start product 0', productTests.startProductFn(0));

    it('logout as admin', shared.logoutFn());

    // actual test

    it('add admin user and sign JWT',  function() { authService.addUser(admin) });

    it('login as admin', shared.loginFn(admin));

    it('create discussion 0 from admin to task 0 step 1', tests.createDiscussionFn({
        questionIndex: 0,
        taskIndex: 0,
        workflowIndex: 0,
        stepIndex: 1,
    }));

    it('get discussion 0 entry scope', tests.getDiscussionEntryScopeFn(0, { canUpdate: false }));
    it('update discussion 0', tests.updateDiscussionFn(0))
    it('get discussion 0 entry scope', tests.getDiscussionEntryScopeFn(0, { canUpdate: false }));

    it('list discussions', tests.listDiscussionsFn({ taskIndex: 0 }));

    after(shared.unsetupFn());
});
