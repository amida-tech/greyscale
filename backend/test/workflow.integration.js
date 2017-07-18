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
const examples = require('./fixtures/example/surveys');

const legacy = _.cloneDeep(examples.legacy);

describe('workflow integration', function surveyIntegration() {
    const dbname = 'indabatestworkflow'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const surveyTests = new surveyCommon.IntegrationTests(superTest);
    const productTests = new productCommon.IntegrationTests(superTest, surveyTests.hxSurvey);
    const tests = new workflowCommon.IntegrationTests(superTest, surveyTests.hxSurvey, productTests.hxProduct);

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

    it('create survey', surveyTests.createSurveyFn(legacy));

    it('create product', productTests.createProductFn(0));

    it('list workflows', tests.listWorkflowsFn());

    it('create workflow', tests.createWorkflowFn(0));

    it('get workflow', tests.getWorkflowFn(0));

    it('list workflows', tests.listWorkflowsFn());

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
