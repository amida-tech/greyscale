'use strict';

const chai = require('chai');

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
    constructor(supertest, hxSurvey, hxProduct) {
        this.supertest = supertest;
        this.hxSurvey = hxSurvey;
        this.hxProduct = hxProduct;
        this.hxWorkflow = new History();
    }

    createWorkflowFn(productIndex) {
        const supertest = this.supertest;
        const hxSurvey = this.hxSurvey;
        const hxWorkflow = this.hxWorkflow;
        return function createWorkflow() {
            const productId = hxSurvey.id(productIndex);
            const workflow = generate(productId);
            return supertest.post('workflows', workflow, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxWorkflow.push(workflow, res.body);
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
            return supertest.get('Workflows', 200)
                .then((res) => {
                    comparator.workflows(list, res.body);
                });
        }
    }
};

module.exports = {
    IntegrationTests,
};
