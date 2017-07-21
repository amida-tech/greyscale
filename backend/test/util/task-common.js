'use strict';

const chai = require('chai');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const Generator = class {
    constructor() {
        this.index = -1;
    }

    generate({ uoaId, stepId, productId, userId }) {
        this.index += 1;
        return {
            title: `task_title_${this.index}`,
            uoaId, stepId, productId, userId,
        }
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options) {
        this.supertest = supertest;
        this.hxProduct = options.hxProduct;
        this.hxUser = options.hxUser;
        this.hxWorkflowStep = options.hxWorkflowStep;
        this.hxUOA = options.hxUOA;
        this.hxTask = new History();
        this.generator = new Generator();
    }

    createTaskFn({ productIndex, uoaIndex, userIndex, workflowIndex, stepIndex }) {
        const that = this;
        return function createTask() {
            const productId = that.hxProduct.id(productIndex);
            const uoaId = that.hxUOA.id(uoaIndex);
            const userId = that.hxUser.id(userIndex);
            const stepId = that.hxWorkflowStep.get(workflowIndex).id(stepIndex);
            const task = that.generator.generate({ productId, uoaId, userId, stepId });
            return that.supertest.post('tasks', task, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    that.hxTask.push(task, res.body);
                });
        }
    }

    getTaskFn(index) {
        const that = this;
        return function getTask() {
            const id = that.hxTask.id(index);
            return that.supertest.get(`tasks/${id}`, 200)
                .then((res) => {
                    const client = that.hxTask.client(index);
                    comparator.task(client, res.body);
                });
        };
    }

    listTasksFn() {
        const that = this;
        return function listTasks() {
            return that.supertest.get(`tasks`, 200)
                .then((res) => {
                    const client = that.hxTask.listClients();
                    comparator.tasks(client, res.body);
                });
        }
    }
};

module.exports = {
    IntegrationTests,
};
