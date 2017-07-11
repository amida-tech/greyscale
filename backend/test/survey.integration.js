/* global before,describe,it,after*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const expect = chai.expect;

const SharedIntegration = require('./util/shared-integration')
const IndaSuperTest = require('./util/inda-supertest');
const userCommon = require('./util/user-common');
const organizationCommon = require('./util/organization-common');
const surveyCommon = require('./util/survey-common');
const comparator = require('./util/comparator');
const examples = require('./fixtures/example/surveys');

const legacy = _.cloneDeep(examples.legacy);

const insertItem = _.omit(legacy, 'questions');

const updateItem = {
    title: insertItem.title + ' --- updated',
    description: insertItem.description + ' --- updated'
};

const surveyQuestions = legacy.questions;

var insertQuestion = {
    'label': 'One more text',
    'isRequired': true,
    'hasComments': true,
    'type': 0,
    'position': 6,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
};

describe('survey integration', function surveyIntegration() {
    const dbname = 'indabatestsurvey'
    const superTest = new IndaSuperTest();
    const shared = new SharedIntegration(superTest);
    const orgTests = new organizationCommon.IntegrationTests(superTest);
    const userTests = new userCommon.IntegrationTests(superTest);
    const tests = new surveyCommon.IntegrationTests(superTest);

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    let surveyId;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', orgTests.createOrganizationFn(organization));

    it('set realm', orgTests.setRealmFn(0));

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('list surveys', tests.listSurveysFn());

    it('logout as super user', shared.logoutFn());

    it('organization admin activates', userTests.selfActivateFn(0));

    it('login as admin', shared.loginFn(admin));

    it('create survey', tests.createSurveyFn(insertItem));

    it('get survey', tests.getSurveyFn(0));

    it('list surveys', tests.listSurveysFn());

    it('update survey', tests.updateSurveyFn(0, updateItem));

    it('get survey', tests.getSurveyFn(0));

    it('delete survey', tests.deleteSurveyFn(0));

    it('list surveys', tests.listSurveysFn());

    it('add questions to survey', function addQuestionsToSurvey() {
        insertItem.questions = surveyQuestions;
    });

    it('create survey', function createSurvey() {
        return superTest.post('surveys', insertItem, 201)
            .then((res) => {
                surveyId = res.body.id;
                expect(!!surveyId).to.equal(true);
            });
    });

    it('get survey', function getSurvey() {
        return superTest.get(`surveys/${surveyId}`, 200)
            .then((res) => {
                comparator.survey(insertItem, res.body);
            });
    });

    it('list surveys', function listSurveys() {
        return superTest.get('surveys', 200)
            .then((res) => {
                expect(res.body).has.length(1);
            });
    });

    it('get survey questions', function getSurveyQuestions() {
        return superTest.get(`surveys/${surveyId}/questions`, 200, { order: 'id' })
            .then((res) => {
                const opts = { noOptions: true, surveyId };
                comparator.questions(insertItem.questions, res.body, opts);
            });
    });

    let questionId;

    it('add a new question for survey', function addQuestionToSurvey() {
        return superTest.post(`surveys/${surveyId}/questions`, insertQuestion, 201)
            .then((res) => {
                questionId = res.body.id;
                expect(!!questionId).to.equal(true);
                surveyQuestions.push(insertQuestion);
            });

    });

    it('get survey questions', function getSurveyQuestions() {
        return superTest.get(`surveys/${surveyId}/questions`, 200, { order: 'id' })
            .then((res) => {
                const opts = { noOptions: true, surveyId };
                comparator.questions(insertItem.questions, res.body, opts);
            });
    });

    it('update new question', function updateNewQuestion() {
        insertQuestion.label = insertQuestion.label + ' --- updated';
        return superTest.put(`questions/${questionId}`, insertQuestion, 202);
    });

    it('get survey questions', function getSurveyQuestions() {
        return superTest.get(`surveys/${surveyId}/questions`, 200, { order: 'id' })
            .then((res) => {
                const opts = { noOptions: true, surveyId };
                comparator.questions(insertItem.questions, res.body, opts);
            });
    });

    it('delete new question', function deleteNewQuestion() {
        surveyQuestions.splice(surveyQuestions.length - 1, 1);
        return superTest.delete(`questions/${questionId}`, 204);
    });

    it('get survey questions', function getSurveyQuestions() {
        return superTest.get(`surveys/${surveyId}/questions`, 200, { order: 'id' })
            .then((res) => {
                const opts = { noOptions: true, surveyId };
                comparator.questions(insertItem.questions, res.body, opts);
            });
    });

    it('delete survey', function updateSurvey() {
        return superTest.delete( `surveys/${surveyId}`, 204);
    });

    it('list surveys', function listSurveys() {
        return superTest.get('surveys', 200)
            .then((res) => {
                expect(res.body).has.length(0);
            });
    });

    it('logout as admin', shared.logoutFn());

    after(shared.unsetupFn());
});
