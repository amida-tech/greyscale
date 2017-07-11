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
const comparator = require('./util/comparator');

const insertItem = {
    title: 'Test survey',
    description: 'Description of test survey',
    projectId: 2 // TODO get from user self
};

const updateItem = {
    title: insertItem.title + ' --- updated',
    description: insertItem.description + ' --- updated'
};

const surveyQuestions = [{
    'label': 'Text 1',
    'isRequired': true,
    'hasComments': true,
    'type': 0,
    'position': 1,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
}, {
    'label': 'Bullet points 2',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 11,
    'position': 2,
    'description': 'Description 2',
    'qid': 'Question ID 1',
    'skip': 0,
    'size': 0,
    'value': 'Value 1'
}, {
    'label': 'Paragraph 3',
    'isRequired': true,
    'type': 1,
    'position': 3,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
}, {
    'label': 'Multiple choice 4',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 3,
    'position': 4,
    'description': 'Description 4',
    'qid': '',
    'skip': 0,
    'size': 0,
    'incOtherOpt': true,
    'value': 'Value Other',
    'optionNumbering': 'decimal',
    'options': [{
        'label': 'Label 1',
        'value': 'Value 1',
        'isSelected': true
    }, {
        'label': 'Label 2',
        'value': 'Value 2',
        'isSelected': false
    }]
}, {
    'label': 'Checkboxes 5',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 2,
    'position': 5,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0,
    'incOtherOpt': true,
    'value': 'Other3',
    'optionNumbering': 'lower-latin',
    'options': [{
        'label': 'L1',
        'value': 'V1',
        'isSelected': true
    }, {
        'label': 'L2',
        'value': 'V2',
        'isSelected': false
    }]
}];

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
    const userTests = new userCommon.IntegrationTests(superTest);

    const superAdmin = config.testEntities.superAdmin;
    const organization = config.testEntities.organization;
    const admin = config.testEntities.admin;
    let surveyId;

    before(shared.setupFn({ dbname }));

    it('login as super user', shared.loginAdminFn(superAdmin));

    it('create organization', function createOrganization() {
        return superTest.postAdmin('organizations', organization, 201);
    });

    it('set realm', function setAdminRealm() {
        superTest.setRealm(organization.realm);
    });

    it('invite organization admin', userTests.inviteUserFn(admin));

    it('list surveys', function listSurveys() {
        return superTest.get('surveys', 200)
            .then((res) => {
                expect(res.body).has.length(0);
            });
    });

    it('logout as super user', shared.logoutFn());

    it('organization admin activates', userTests.selfActivateFn(0));

    it('login as admin', shared.loginFn(admin));

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
                const actual = _.pick(res.body, ['description', 'title', 'projectId']);
                expect(actual).to.deep.equal(insertItem);
            });
    });

    it('list surveys', function listSurveys() {
        return superTest.get('surveys', 200)
            .then((res) => {
                expect(res.body).has.length(1);
                const actual = _.pick(res.body[0], ['description', 'title', 'projectId']);
                expect(actual).to.deep.equal(insertItem);
            });
    });

    it('update survey', function updateSurvey() {
        return superTest.put( `surveys/${surveyId}`, updateItem, 202);
    });

    it('get survey', function getSurvey() {
        return superTest.get(`surveys/${surveyId}`, 200)
            .then((res) => {
                const actual = _.pick(res.body, ['description', 'title', 'projectId']);
                const expected = _.cloneDeep(insertItem);
                Object.assign(expected, updateItem);
                expect(actual).to.deep.equal(expected);
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
