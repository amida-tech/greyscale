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

    generate(unitOfAnalysisType) {
        return {
            subjects: `uoa_${this.index}`,
            unitOfAnalysisType,
        }
    }

    update(current) {
        const result = _.cloneDeep(current);
        result.name += ' --updated';
        return result;
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options) {
        this.supertest = supertest;
        this.hxUOA = options.hxUOA || new History();
        this.generator = new Generator();
        this.hxUOAType = options.hxUOAType;
        this.hxUser = options.hxUser;
    }

    createUOAFn(typeIndex, userIndex) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOA = this.hxUOA;
        const hxUOAType = this.hxUOAType;
        const hxUser = this.hxUser;
        return function createUOA() {
            const unitOfAnalysisType = hxUOAType.id(typeIndex);
            const uoa = generator.generate(unitOfAnalysisType);
            return supertest.post('uoas', uoa, 201)
                .then((res) => {
                    expect(!!res.body[0].id).to.equal(true);
                    const userId = hxUser.id(userIndex);
                    uoa.ownerId = userId;
                    uoa.creatorId = userId;
                    hxUOA.push(uoa, res.body[0]);
                });
        }
    }

    getUOAFn(index) {
        const supertest = this.supertest;
        const hxUOA = this.hxUOA;
        return function getUOA() {
            const id = hxUOA.id(index);
            return supertest.get(`uoas/${id}`, 200)
                .then((res) => {
                    const client = hxUOA.client(index);
                    comparator.uoa(client, res.body);
                });
        };
    }

    updateUOAFn(index) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOA = this.hxUOA;
        return function updateUOA() {
            const client = hxUOA.client(index);
            const update = generator.update(client);
            Object.assign(client, update);
            const id = hxUOA.id(index);
            return supertest.put(`uoas/${id}`, update, 202);
        }
    }

    listUOAsFn() {
        const supertest = this.supertest;
        const hxUOA = this.hxUOA;
        return function listUOAs() {
            const list = hxUOA.listClients();
            return supertest.get('uoas', 200)
                .then((res) => {
                    comparator.uoas(list, res.body);
                });
        }
    }

    deleteUOAFn(index) {
        const supertest = this.supertest;
        const hxUOA = this.hxUOA;
        return function deleteUOA() {
            const id = hxUOA.id(index);
            return supertest.delete(`uoas/${id}`, 204)
                .then(() => hxUOA.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
