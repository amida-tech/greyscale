'use strict';

const chai = require('chai');
const _ = require('lodash');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const generate = function (productId) {
    return {
        name: 'Test workflow',
        description: 'Description of test workflow',
        productId: productId
    };
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options) {
        this.supertest = supertest;
        this.hxSurvey = options.hxSurvey;
        this.hxProduct = options.hxProduct;
        this.hxGroup = options.hxGroup;
        this.hxWorkflow = new History();
        this.hxWorkflowStep = new Map();
    }

    createWorkflowFn(productIndex) {
        const that = this;
        return function createWorkflow() {
            const productId = that.hxProduct.id(productIndex);
            const workflow = generate(productId);
            return that.supertest.post('workflows', workflow, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    const index = that.hxWorkflow.length();
                    that.hxWorkflow.push(workflow, res.body);
                    that.hxWorkflowStep.set(index, new History());
                });
        }
    }

    getWorkflowFn(index) {
        const supertest = this.supertest;
        const hxWorkflow = this.hxWorkflow;
        return function getWorkflow() {
            const id = hxWorkflow.id(index);
            return supertest.get(`workflows/${id}`, 200)
                .then((res) => {
                    const client = hxWorkflow.client(index);
                    comparator.workflow(client, res.body);
                });
        };
    }

    listWorkflowsFn() {
        const supertest = this.supertest;
        const hxWorkflow = this.hxWorkflow;
        return function listWorkflow() {
            const list = hxWorkflow.listClients();
            return supertest.get('workflows', 200)
                .then((res) => {
                    comparator.workflows(list, res.body);
                });
        }
    }

    createWorkflowStepsFn(index, options = {}) {
        const that = this;
        return function createWorkflowSteps() {
            const id = that.hxWorkflow.id(index);
            const count = options.count || 4;
            const groups = options.groups;
            const steps = _.range(count).map((stepIndex) => {
                const step = {
                    title: `title_${stepIndex}`,
                };
                if (groups) {
                    const groupIndices = groups[stepIndex];
                    if (groupIndices) {
                        const usergroupId = groupIndices.map((gndx) => that.hxGroup.id(gndx));
                        step.usergroupId = usergroupId;
                    }
                }
                return step;
            });
            return that.supertest.put(`workflows/${id}/steps`, steps, 200)
                .then((res) => {
                    const hxWorkflowStep = that.hxWorkflowStep.get(index);
                    expect(res.body.inserted).to.have.length(steps.length);
                    steps.forEach((step, stepIndex) => {
                        step.workflowId = id;
                        if (!step.usergroupId) {
                            step.usergroupId = [];
                        }
                        hxWorkflowStep.push(step, { id: res.body.inserted[stepIndex] });
                    });
                });
        }
    }

    getWorkflowStepsFn(index) {
        const that = this;
        return function getWorkflowSteps() {
            const id = that.hxWorkflow.id(index);
            return that.supertest.get(`workflows/${id}/steps`, 200)
                .then((res) => {
                    const list = that.hxWorkflowStep.get(index).listClients();
                    comparator.workflowSteps(list, res.body);
                });
        }
    }
};

module.exports = {
    IntegrationTests,
};
