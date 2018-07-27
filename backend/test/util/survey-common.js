'use strict';

const chai = require('chai');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const IntegrationTests = class IntegrationTests {
    constructor(supertest, { hxSurvey, hxQuestion } = {}) {
        this.supertest = supertest;
        this.hxSurvey = hxSurvey || new History();
        this.hxQuestion = hxQuestion || new History();
    }

    createSurveyFn(survey) { // TODO: Replace with a mock service.
        const that = this;
        return function createSurvey() {
            return that.supertest.post('surveys', survey, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    that.hxSurvey.push(survey, res.body);
                    const questions = survey.questions;
                    if (questions) {
                        questions.forEach((question, index) => {
                            that.hxQuestion.push(question, res.body.questions[index]);
                        });
                    }
                });
        }
    }

    getSurveyFn(index) {
        const supertest = this.supertest;
        const hxSurvey = this.hxSurvey;
        return function getSurvey() {
            const id = hxSurvey.id(index);
            return supertest.get(`surveys/${id}`, 200)
                .then((res) => {
                    const client = hxSurvey.client(index);
                    comparator.survey(client, res.body);
                });
        };
    }

    updateSurveyFn(index, update) {
        const supertest = this.supertest;
        const hxSurvey = this.hxSurvey;
        return function updateSurvey() {
            const id = hxSurvey.id(index);
            return supertest.put(`surveys/${id}`, update, 202)
                .then(() => {
                    hxSurvey.updateClient(index, update);
                });
        };
    }

    listSurveysFn() {
        const supertest = this.supertest;
        const hxSurvey = this.hxSurvey;
        return function listSurvey() {
            const list = hxSurvey.listClients();
            return supertest.get('surveys', 200)
                .then((res) => {
                    comparator.surveys(list, res.body);
                });
        }
    }

    deleteSurveyFn(index) {
        const supertest = this.supertest;
        const hxSurvey = this.hxSurvey;
        return function deleteSurvey() {
            const id = hxSurvey.id(index);
            return supertest.delete( `surveys/${id}`, 204)
                .then(() => hxSurvey.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
