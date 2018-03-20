'use strict';

const _ = require('lodash');
const mock = require('mock-require');

const config = require('./config');

const SharedIntegration = require('./test/util/shared-integration');
const IndaSuperTest = require('./test/util/inda-supertest');
const organizationCommon = require('./test/util/organization-common');
const userCommon = require('./test/util/user-common');
const groupCommon = require('./test/util/group-common');
const History = require('./test/util/history');
const AuthService = require('./test/util/mock_auth_service');

const authService = new AuthService();
const superTest = new IndaSuperTest(authService);
const shared = new SharedIntegration(superTest);
const orgTests = new organizationCommon.IntegrationTests(superTest);

const hxGroup = new History();
const userTests = new userCommon.IntegrationTests(superTest, { hxGroup });

const groupOptions = { hxOrganization: orgTests.hxOrganization, hxGroup };
const groupTests = new groupCommon.IntegrationTests(superTest, groupOptions);

const superAdmin = config.testEntities.superAdmin;
const organization = config.testEntities.organization;
const admin = config.testEntities.admin;
const users = config.testEntities.users;

shared.setupForSeedFn()()
    .then((continueInitialization) => {
        if (!continueInitialization) {
            console.log('already initialized');
            process.exit(0);
            return;
        }
        return Promise.resolve()
            .then(() => authService.addUser(superAdmin))
            .then(shared.loginFn(superAdmin))
            .then(orgTests.createOrganizationFn(organization))
            .then(orgTests.setRealmFn(0))
            .then(orgTests.getOrganizationFn(0))
            .then(userTests.inviteUserFn(admin))
            .then(shared.logoutFn())
            .then(() => authService.addUser(admin))
            .then(shared.loginFn(admin))
            .then(userTests.checkActivitabilityFn(0))
            .then(userTests.selfActiv   ateFn(0))
            .then(() => {
                let px = Promise.resolve();
                users.forEach((user) => {
                    px = px.then(userTests.inviteUserFn(user));
                });
                return px;
            })
            .then(shared.logoutFn())
            .then(() => {
                let px = Promise.resolve();
                users.forEach((user, index) => {
                    px = px.then(userTests.selfActivateFn(index + 1));
                    px = px.then(() => authService.addUser(user));
                    px = px.then(shared.loginFn(user));
                    px = px.then(shared.logoutFn());
                });
                return px;
            })
            .then(shared.loginFn(admin))
            .then(() => {
                let px = Promise.resolve();
                _.range(4).forEach(() => {
                    px = px.then(groupTests.createGroupFn());
                });
                return px;
            })
            .then(userTests.updateUserGroupsFn(1, [0, 2]))
            .then(userTests.updateUserGroupsFn(2, [1, 2]))
            .then(userTests.getUserFn(1))
            .then(userTests.getUserFn(2))
            .then(shared.logoutFn())
            .then(shared.unsetupFn())
            .then(() => {
                console.log('success');
                process.exit(0);
            });
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
