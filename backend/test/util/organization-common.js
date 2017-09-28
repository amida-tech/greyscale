'use strict';

const chai = require('chai');
const _ = require('lodash');

const History = require('./history');

const expect = chai.expect;

const IntegrationTests = class IntegrationTests {
    constructor(supertest) {
        this.supertest = supertest;
        this.hxOrganization = new History();
    }

    createOrganizationFn(organization) {
        const supertest = this.supertest;
        const hxOrganization = this.hxOrganization;
        return function createOrganization() {
            return supertest.postAdmin('organizations', organization, 201)
                .then((res) => {
                    hxOrganization.push(organization, res.body);
                });
        }
    }

    createOrganizationWithNoJWTFn(organization) {
        const supertest = this.supertest;
        const hxOrganization = this.hxOrganization;
        return function createOrganization() {
            return supertest.postAdmin('organizations', organization, 401)
                .then((res) => {
                    hxOrganization.push(organization, res.body);
                });
        }
    }

    getOrganizationFn(index) {
        console.log('1. INDEX IS: ' + index);
        const supertest = this.supertest;
        const hxOrganization = this.hxOrganization;
        return function getOrganization() {
            console.log('2. INDEX IS: ' + index);
            const orgId = hxOrganization.id(index);
            console.log('4. ORG ID IS: ' + orgId);

            return supertest.get(`organizations/${orgId}`, 200)
                .then((res) => {
                    const organization = hxOrganization.client(index);
                    console.log('5. ORG IS: ' + organization);
                    const expected = Object.assign({ id: orgId }, organization);
                    const actual = _.pick(res.body, ['id', 'realm', 'name']);
                    expect(actual).to.deep.equal(expected);
                });
        };
    }

    setRealmFn(index) {
        const supertest = this.supertest;
        const hxOrganization = this.hxOrganization;
        return function setRealm() {
            const organization = hxOrganization.client(index);
            supertest.setRealm(organization.realm);
        }
    }
};

module.exports = {
    IntegrationTests,
};
