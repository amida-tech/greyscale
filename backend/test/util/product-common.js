'use strict';

const chai = require('chai');

var Products = require('../../app/models/products');

const History = require('./history');
const comparator = require('./comparator');

const expect = chai.expect;

const generate = function (surveyId) {
    return {
        title: 'Test product',
        description: 'Description of test product',
        projectId: 2, // todo get from user self
        surveyId: surveyId,
        status: Products.statuses[0]
    };
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, { hxSurvey, hxUOA }) {
        this.supertest = supertest;
        this.hxSurvey = hxSurvey;
        this.hxUOA = hxUOA;
        this.hxProduct = new History();
    }

    createProductFn(surveyIndex) {
        const supertest = this.supertest;
        const hxProduct = this.hxProduct;
        return function createProduct() {
            const surveyId = Math.random() * (Math.floor(5) - Math.ceil(1)) + Math.ceil(1);
            const product = generate(surveyId);
            return supertest.post('products', product, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    hxProduct.push(product, res.body);
                });
        }
    }

    getProductFn(index) {
        const supertest = this.supertest;
        const hxProduct = this.hxProduct;
        return function getProduct() {
            const id = hxProduct.id(index);
            return supertest.get(`products/${id}`, 200)
                .then((res) => {
                    const client = hxProduct.client(index);
                    comparator.product(client, res.body);
                });
        };
    }

    listProductsFn() {
        const supertest = this.supertest;
        const hxProduct = this.hxProduct;
        return function listProduct() {
            const list = hxProduct.listClients();
            return supertest.get('products', 200)
                .then((res) => {
                    comparator.products(list, res.body);
                });
        };
    }

    addUOAFn({ index, uoaIndex }) {
        const that = this;
        return function startProduct() {
            const id = that.hxProduct.id(index);
            const uoaId = that.hxUOA.id(uoaIndex);
            return that.supertest.post(`products/${id}/uoa/${uoaId}`, {}, 201);
        };
    }

    startProductFn(index) {
        const that = this;
        return function startProduct() {
            const id = that.hxProduct.id(index);
            const payload = { status: Products.statuses[1] };
            return that.supertest.put(`products/${id}`, payload, 202);
        };
    }
};

module.exports = {
    IntegrationTests,
};
