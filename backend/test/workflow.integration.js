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
const History = require('./util/History');

const examples = require('./fixtures/example/surveys');

const legacy = _.cloneDeep(examples.legacy);

describe('workflow integration', function surveyIntegration() {
    const dbname = 'indabatestworkflow'
    const superTest = new IndaSuperTest();
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

    const tests = new workflowCommon.IntegrationTests(superTest, {
        hxSurvey: surveyTests.hxSurvey,
        hxProduct: productTests.hxProduct,
        hxGroup
    });

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('logout as super user', shared.logoutFn());

    it('organization admin activates', userTests.selfActivateFn(0));

    it('login as admin', shared.loginFn(admin));

    _.range(4).forEach((index) => {
        it(`create group ${index}`, groupTests.createGroupFn());
    });

    it('create survey', surveyTests.createSurveyFn(legacy));

    _.range(2).forEach((index) => {
        it('list workflows', tests.listWorkflowsFn());
        it('create product', productTests.createProductFn(0));
        it(`create workflow ${index}`, tests.createWorkflowFn(index));
        it(`get workflow ${index}`, tests.getWorkflowFn(index));
    });

    it('list workflows', tests.listWorkflowsFn());

    it('create workflow 0 steps', tests.createWorkflowStepsFn(0, {
        count: 4,
    }))
    it('get workflow 0 steps', tests.getWorkflowStepsFn(0));

    it('create workflow 1 steps', tests.createWorkflowStepsFn(1, {
        count: 4,
        groups: [[0, 1], null, null, [1]],
    }))
    it('get workflow 1 steps', tests.getWorkflowStepsFn(1));

    it('get workflow (no step information)', tests.getWorkflowFn(0));

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
