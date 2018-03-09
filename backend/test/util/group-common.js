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
            title: `group_${this.index}`,
        }
    }

    update(current) {
        const result = _.cloneDeep(current);
        result.title += ' --updated';
        return result;
    }
};

const IntegrationTests = class IntegrationTests {
    constructor(supertest, options) {
        this.supertest = supertest;
        this.hxGroup = options.hxGroup || new History();
        this.generator = new Generator();
        this.hxOrganization = options.hxOrganization;
    }

    createGroupWithOutJWTFn() {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        const generator = this.generator;
        const hxOrganization = this.hxOrganization;
        return function createGroup() {
            const orgId = hxOrganization.id(0);
            const group = generator.generate();
            return supertest.post(`organizations/${orgId}/groups`, group, 401)

        }
    }

    createGroupFn() {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        const generator = this.generator;
        const hxOrganization = this.hxOrganization;
        return function createGroup() {
            const orgId = hxOrganization.id(0);
            const group = generator.generate();
            return supertest.post(`organizations/${orgId}/groups`, group, 201)
                .then((res) => {
                    expect(!!res.body.id).to.equal(true);
                    group.organizationId = orgId;
                    hxGroup.push(group, res.body);
                });
        }
    }

    getGroupFn(index) {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        return function getGroup() {
            const id = hxGroup.id(index);
            return supertest.get(`groups/${id}`, 200)
                .then((res) => {
                    const client = hxGroup.client(index);
                    comparator.group(client, res.body);
                });
        };
    }

    updateGroupFn(index) {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        const generator = this.generator;
        return function updateGroup() {
            const id = hxGroup.id(index);
            const current = hxGroup.client(index);
            const update = generator.update(current);
            return supertest.put(`groups/${id}`, update, 202)
                .then(() => {
                    hxGroup.updateClient(index, update);
                });
        };
    }

    listGroupsFn() {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        const hxOrganization = this.hxOrganization;
        return function listGroup() {
            const orgId = hxOrganization.id(0);
            const list = hxGroup.listClients();
            return supertest.get(`organizations/${orgId}/groups`, 200)
                .then((res) => {
                    comparator.groups(list, res.body);
                });
        }
    }

    deleteGroupFn(index) {
        const supertest = this.supertest;
        const hxGroup = this.hxGroup;
        return function deleteGroup() {
            const id = hxGroup.id(index);
            return supertest.delete( `groups/${id}`, 204)
                .then(() => hxGroup.remove(index));
        };
    }
};

module.exports = {
    IntegrationTests,
};
