'use strict';

const chai = require('chai');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const IntegrationTests = class IntegrationTests {
    constructor(supertest, hxUOA, hxUOATag) {
        this.supertest = supertest;
        this.hxUOATagLink = new History();
        this.hxUOA = hxUOA;
        this.hxUOATag = hxUOATag;
    }

    createUOATagLinkFn(uoaIndex, uoaTagIndex) {
        const supertest = this.supertest;
        const hxUOATagLink = this.hxUOATagLink;
        const hxUOA = this.hxUOA;
        const hxUOATag = this.hxUOATag;
        return function createUOA() {
            const uoaId = hxUOA.id(uoaIndex);
            const uoaTagId = hxUOATag.id(uoaTagIndex);
            const uoaTagLink = { uoaId, uoaTagId };
            return supertest.post('uoataglinks', uoaTagLink, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxUOATagLink.push(uoaTagLink, res.body);
                });
        }
    }

    listUOATagLinksFn() {
        const supertest = this.supertest;
        const hxUOATagLink = this.hxUOATagLink;
        return function listUOAs() {
            const list = hxUOATagLink.listClients();
            return supertest.get('uoataglinks', 200)
                .then((res) => {
                    comparator.uoataglinks(list, res.body);
                });
        }
    }

    deleteUOATagLinkFn(index) {
        const supertest = this.supertest;
        const hxUOATagLink = this.hxUOATagLink;
        return function deleteUOA() {
            const id = hxUOATagLink.id(index);
            return supertest.delete(`uoataglinks/${id}`, 204)
                .then(() => hxUOATagLink.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
