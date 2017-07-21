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
            name: `uoa_class_type_${this.index}`,
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
        this.hxUOAClassType = new History();
        this.generator = new Generator();
    }

    createUOAClassTypeFn() {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOAClassType = this.hxUOAClassType;
        return function createUOAClassType() {
            const uoaType = generator.generate();
            return supertest.post('uoaclasstypes', uoaType, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxUOAClassType.push(uoaType, res.body);
                });
        }
    }

    getUOAClassTypeFn(index) {
        const supertest = this.supertest;
        const hxUOAClassType = this.hxUOAClassType;
        return function getUOAClassType() {
            const id = hxUOAClassType.id(index);
            return supertest.get(`uoaclasstypes/${id}`, 200)
                .then((res) => {
                    const client = hxUOAClassType.client(index);
                    comparator.uoaType(client, res.body);
                });
        };
    }

    updateUOAClassTypeFn(index) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOAClassType = this.hxUOAClassType;
        return function updateUOAClassType() {
            const client = hxUOAClassType.client(index);
            const update = generator.update(client);
            Object.assign(client, update);
            const id = hxUOAClassType.id(index);
            return supertest.put(`uoaclasstypes/${id}`, update, 202);
        }
    }

    listUOAClassTypesFn() {
        const supertest = this.supertest;
        const hxUOAClassType = this.hxUOAClassType;
        return function listUOAClassTypes() {
            const list = hxUOAClassType.listClients();
            return supertest.get('uoaclasstypes', 200)
                .then((res) => {
                    comparator.uoaTypes(list, res.body);
                });
        }
    }

    deleteUOAClassTypeFn(index) {
        const supertest = this.supertest;
        const hxUOAClassType = this.hxUOAClassType;
        return function deleteUOAClassType() {
            const id = hxUOAClassType.id(index);
            return supertest.delete(`uoaclasstypes/${id}`, 204)
                .then(() => hxUOAClassType.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
