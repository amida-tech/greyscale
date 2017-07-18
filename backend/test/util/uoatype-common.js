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
        return {
            name: `uoa_type_${this.index}`,
        }
    }

    update(current) {
        const result = _.cloneDeep(current);
        result.name += ' --updated';
        return result;
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest) {
        this.supertest = supertest;
        this.hxUOAType = new History();
        this.generator = new Generator();
    }

    createUOATypeFn() {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOAType = this.hxUOAType;
        return function createProduct() {
            const uoaType = generator.generate();
            return supertest.post('uoatypes', uoaType, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxUOAType.push(uoaType, res.body);
                });
        }
    }

    getUOATypeFn(index) {
        const supertest = this.supertest;
        const hxUOAType = this.hxUOAType;
        return function getProduct() {
            const id = hxUOAType.id(index);
            return supertest.get(`uoatypes/${id}`, 200)
                .then((res) => {
                    const client = hxUOAType.client(index);
                    comparator.uoaType(client, res.body);
                });
        };
    }

    updateUOATypeFn(index) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOAType = this.hxUOAType;
        return function createProduct() {
            const client = hxUOAType.client(index);
            const update = generator.update(client);
            Object.assign(client, update);
            const id = hxUOAType.id(index);
            return supertest.put(`uoatypes/${id}`, update, 202);
        }
    }

    listUOATypesFn() {
        const supertest = this.supertest;
        const hxUOAType = this.hxUOAType;
        return function listProduct() {
            const list = hxUOAType.listClients();
            return supertest.get('uoatypes', 200)
                .then((res) => {
                    comparator.uoaTypes(list, res.body);
                });
        }
    }

    deleteUOATypeFn(index) {
        const supertest = this.supertest;
        const hxUOAType = this.hxUOAType;
        return function getProduct() {
            const id = hxUOAType.id(index);
            return supertest.delete(`uoatypes/${id}`, 204)
                .then(() => hxUOAType.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
