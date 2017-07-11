'use strict';

const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

const comparator = {
    addNull(client, server) {
        _.forOwn(server, (value, key) => {
            if ((value === null) && !_.has(client, key)) {
                client[key] = null;
            }
        });
    },
    option(client, server, options) {
        const expected = _.cloneDeep(client);
        this.addNull(expected, server);
        if (server.questionId) {
            expected.questionId = options.questionId;
        }
        expected.id = server.id;
        return expected;
    },
    options(client, server, options) {
        expect(server.length).to.equal(client.length);
        const expected = client.map((option, index) => {
            const actual = server[index];
            return this.option(option, actual, options);
        });
        return expected;
    },
    question(client, server, options) {
        const expected = _.cloneDeep(client);
        ['withLinks', 'incOtherOpt', 'intOnly', 'isWordmml'].forEach((key) => {
            if (_.has(server, key)) {
                expected[key] = expected[key] || false;
            }
        });
        this.addNull(expected, server);
        expected.id = server.id;
        if (server.options) {
            if ((server.options.length === 1) && (server.options[0] === null)) {
                expected.options = server.options;
            } else {
                const opts = Object.assign({ questionId: server.id }, options);
                expected.options = this.options(expected.options, server.options, opts);
            }
        }
        if (options.noOptions) {
            delete expected.options;
        }
        if (options.surveyId && server.surveyId) {
            expected.surveyId = options.surveyId;
        }
        if (server.answers) {
            expected.answers = server.answers;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    questions(client, server, options = {}) {
        expect(server.length).to.equal(client.length);
        const expected = client.map((question, index) => {
            const actual = server[index];
            return this.question(question, actual, options);
        });
        expect(server).to.deep.equal(expected);
        return expected;
    },
    survey(client, server, options = {}) {
        const expected = _.cloneDeep(client);
        this.addNull(expected, server);
        expected.id = server.id;
        expected.created = server.created;
        ['isDraft'].forEach((key) => {
            if (_.has(server, key)) {
                expected[key] = expected[key] || false;
            }
        });
        const opts = Object.assign({ surveyId: server.id }, options);
        if (server.questions && server.questions.length) {
            expected.questions = this.questions(expected.questions, server.questions, opts);
        }
        if (server.projectId && !expected.projectId) {
            expected.projectId = server.projectId;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    surveys(client, server, options) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((survey, index) => {
                const actual = server[index];
                return this.survey(survey, actual, options);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
};

module.exports = comparator;
