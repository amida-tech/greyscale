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

    generate(classTypeId) {
        return {
            name: `uoa_tag_${this.index}`,
            classTypeId,
        }
    }

    update(current) {
        const result = { name: `${current.name} --updated` };
        return result;
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, hxUOAClassType) {
        this.supertest = supertest;
        this.hxUOATag = new History();
        this.hxUOAClassType = hxUOAClassType;
        this.generator = new Generator();
    }

    createUOATagFn(classTypeIndex) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOATag = this.hxUOATag;
        const hxUOAClassType = this.hxUOAClassType;
        return function createUOATag() {
            const classTypeId = hxUOAClassType.id(classTypeIndex);
            const uoaTag = generator.generate(classTypeId);
            return supertest.post('uoatags', uoaTag, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxUOATag.push(uoaTag, res.body);
                });
        }
    }

    getUOATagFn(index) {
        const supertest = this.supertest;
        const hxUOATag = this.hxUOATag;
        return function getUOATag() {
            const id = hxUOATag.id(index);
            return supertest.get(`uoatags/${id}`, 200)
                .then((res) => {
                    const client = hxUOATag.client(index);
                    comparator.uoaTag(client, res.body);
                });
        };
    }

    updateUOATagFn(index) {
        const supertest = this.supertest;
        const generator = this.generator;
        const hxUOATag = this.hxUOATag;
        return function updateUOATag() {
            const client = hxUOATag.client(index);
            const update = generator.update(client);
            Object.assign(client, update);
            const id = hxUOATag.id(index);
            return supertest.put(`uoatags/${id}`, update, 202);
        }
    }

    listUOATagsFn() {
        const supertest = this.supertest;
        const hxUOATag = this.hxUOATag;
        return function listUOATags() {
            const list = hxUOATag.listClients();
            return supertest.get('uoatags', 200)
                .then((res) => {
                    comparator.uoaTags(list, res.body);
                });
        }
    }

    deleteUOATagFn(index) {
        const supertest = this.supertest;
        const hxUOATag = this.hxUOATag;
        return function deleteUOATag() {
            const id = hxUOATag.id(index);
            return supertest.delete(`uoatags/${id}`, 204)
                .then(() => hxUOATag.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
