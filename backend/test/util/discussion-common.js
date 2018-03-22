'use strict';

const chai = require('chai');
const _ = require('lodash');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const Generator = class {
    constructor() {
        this.index = -1;
    }

    generate() {
        this.index += 1;
        const entry = `discussion entry ${this.index}`;
        return { entry };
    }

    update(client) {
        const entry = `updated -- ${client.entry}`;
        return { entry };
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, { hxUser, hxTask, hxProduct, hxWorkflowStep, hxQuestion }) {
        this.supertest = supertest;
        this.generator = new Generator();
        this.hxDiscussion = new History();
        this.hxTask = hxTask;
        this.hxWorkflowStep = hxWorkflowStep;
        this.hxQuestion = hxQuestion;
        this.hxProduct = hxProduct;
        this.hxUser = hxUser
    }

    createDiscussionFn({ questionIndex, taskIndex, workflowIndex, stepIndex }) {
        const that = this;
        return function createDiscussion() {
            const taskId = that.hxTask.id(taskIndex);
            const task = that.hxTask.client(taskIndex);
            const product = that.hxProduct.client(0);
            const steps = that.hxWorkflowStep.get(workflowIndex);
            const discussion = Object.assign(that.generator.generate(), {
                questionId: 1,
                taskId,
                stepId: steps.id(stepIndex),
            });
            return that.supertest.post('discussions', discussion, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    const server = _.cloneDeep(discussion);
                    server.id = res.body.id;
                    server.taskId = taskId;
                    server.productId = task.productId;
                    server.surveyId = product.surveyId;
                    server.uoaId = task.uoaId;
                    server.activated = true;
                    server.isResolve = server.isResolve || false;
                    server.isReturn = server.isReturn || false;
                    server.stepFromId = task.stepId;
                    server.userFromId = that.supertest.userId;
                    server.order = 1;
                    that.hxDiscussion.push(discussion, server);
                });
        }
    }

    updateDiscussionFn(index) {
        const that = this;
        return function updateDiscussion() {
            const client = that.hxDiscussion.client(index);
            const server = that.hxDiscussion.server(index);
            const update = that.generator.update(client);
            Object.assign(client, update);
            Object.assign(server, update);
            return that.supertest.put(`discussions/${server.id}`, update, 202);
        }
    }

    getDiscussionEntryScopeFn(index, client) {
        const that = this;
        return function getDiscussion() {
            const id = that.hxDiscussion.id(index);
            return that.supertest.get(`discussions/entryscope/${id}`, 200)
                .then((res) => {
                    comparator.discussionEntryScope(client, res.body);
                });
        };
    }

    listDiscussionsFn({ taskIndex }) {
        const that = this;
        return function getDiscussion() {
            const taskId = that.hxTask.id(taskIndex);
            return that.supertest.get('discussions', 200, { taskId })
                .then((res) => {
                    const list = that.hxDiscussion.listServers();
                    comparator.discussions(list, res.body);
                });
        };
    }
};

module.exports = {
    IntegrationTests,
};
