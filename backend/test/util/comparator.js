'use strict';

const chai = require('chai');
const _ = require('lodash');
const moment = require('moment');

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
    product(client, server) {
        const expected = _.cloneDeep(client);
        this.addNull(expected, server);
        expected.id = server.id;
        expect(server).to.deep.equal(expected);
        return expected;
    },
    products(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((product, index) => {
                const actual = server[index];
                return this.product(product, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    workflow(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        expected.created = server.created;
        expect(server).to.deep.equal(expected);
        return expected;
    },
    workflows(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((workflow, index) => {
                const actual = server[index];
                return this.workflow(workflow, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    uoaType(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        if (!expected.langId) {
            expected.langId = 1;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    uoaTypes(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((uoaType, index) => {
                const actual = server[index];
                return this.uoaType(uoaType, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    uoaTag(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        if (!expected.langId) {
            expected.langId = 1;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    uoaTags(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((uoaTag, index) => {
                const actual = server[index];
                return this.uoaTag(uoaTag, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    timestamp(server, property) {
        const compareDateTime = moment().subtract(2, 'second');
        const serverStamp = server[property];
        const dateTime = moment(serverStamp);
        expect(dateTime.isAfter(compareDateTime)).to.equal(true);
        return serverStamp;
    },
    uoa(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        if (!expected.langId) {
            expected.langId = 1;
        }
        if (!expected.visibility) {
            expected.visibility = 1;
        }
        if (!expected.status) {
            expected.status = 1;
        }
        expected.created = this.timestamp(server, 'created');
        if (server.updated) {
            expected.updated = this.timestamp(server, 'updated');
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    uoas(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((uoa, index) => {
                const actual = server[index];
                return this.uoa(uoa, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    uoataglink(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        expect(server).to.deep.equal(expected);
        return expected;
    },
    uoataglinks(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((uoa, index) => {
                const actual = server[index];
                return this.uoataglink(uoa, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    group(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        if (server.userIds && server.userIds[0] === null) {
            expected.userIds = server.userIds;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    groups(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((group, index) => {
                const actual = server[index];
                return this.group(group, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    user(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        console.log(`EXPECTED AUTH ID = ${expected.authId}`);
        console.log(`SERVER AUTH ID = ${server.authId}`);
        expected.authId = server.authId;
        this.addNull(expected, server);
        delete expected.password;
        delete expected.token;
        expected.created = this.timestamp(server, 'created');
        expected.isActive = true;
        expected.isAnonymous = false;
        expected.organizationId = server.organizationId;
        expect(server).to.deep.equal(expected);
        return expected;
    },
    workflowStep(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        expected.allowEdit = server.allowEdit || false;
        expect(server).to.deep.equal(expected);
        return expected;
    },
    workflowSteps(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((workflowStep, index) => {
                const actual = server[index];
                return this.workflowStep(workflowStep, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    task(client, server, listView) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        this.addNull(expected, server);
        expected.created = this.timestamp(server, 'created');
        expected.isComplete = server.isComplete;
        if (!listView) {
            expected.flagged = expected.flagged || false;
            expected.flaggedcount = expected.flaggedcount || "0";
            expected.status = server.status || 'waiting';
        }
        if (expected.userId) {
            expected.userIds = [expected.userId];
            expected.userId = null;
        }
        if ((expected.position === undefined) && (server.position !== undefined)) {
            expected.position = server.position;
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    tasks(client, server, listView=true) {
        if (server.length) {
            const expected = client.map((task, index) => {
                const actual = server[index];
                return this.task(task, actual, listView);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    },
    discussionEntryScope(client, server) {
        const expected = _.cloneDeep(client);
        expect(server).to.deep.equal(expected);
        return expected;
    },
    discussion(client, server) {
        const expected = _.cloneDeep(client);
        this.addNull(expected, server);
        expected.created = this.timestamp(server, 'created');
        if (server.updated) {
            expected.updated = this.timestamp(server, 'updated');
        }
        expect(server).to.deep.equal(expected);
        return expected;
    },
    discussions(client, server) {
        expect(server.length).to.equal(client.length);
        if (server.length) {
            const expected = client.map((discussion, index) => {
                const actual = server[index];
                return this.discussion(discussion, actual);
            });
            expect(server).to.deep.equal(expected);
            return expected;
        }
    }
};

module.exports = comparator;
