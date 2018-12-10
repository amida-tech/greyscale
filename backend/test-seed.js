'use strict';

const _ = require('lodash');
const config = require('./config');
const request = require('request-promise');
const util = require('./data-utils');
const models = require('./models');


const jwt = require('jsonwebtoken');
const schema = _.get(config, 'testEntities.organization.realm', 'public');
const db = models(config.pgConnect, ['sceleton']);
const appGenerator = require('./app/app-generator');

const testSuperAdmin = config.testEntities.superAdmin;
const testAdmin = config.testEntities.admin;
const testUsers = config.testEntities.users;
const organization = config.testEntities.organization;
let activeToken = null;
let addToAuth = true;
let adminActivationToken = null;
let app = null;
const userActivationTokens = [];

// Add '--blank' to create database without test users.
function mockAuth(email, scopes) {
    const payload = {
        username: email,
        email,
        scopes: [scopes],
    };
    activeToken = 'Bearer ' + jwt.sign(payload, config.jwtSecret);
}

Promise.resolve()
    .then(() => {
        if (process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD) {
            console.log('*********\nAdmin password provided. Using to create users on auth service.\n');
            return loginAuth(process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME, process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD);
        } else if (process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration true. Creating users on auth service.\n');
        } else {
            console.log('*********\nNo means to create users on auth service detected. Only creating them in Indaba.\n');
            process.exit(0);
        }
    })
    .then(() => { // Add users to auth if available.
        const promiseChain = [];
        promiseChain.push(util.createUserOnAuth(testAdmin));
        testUsers.forEach((user) => {
            promiseChain.push(util.createUserOnAuth(user));
        });
        const sysMessageUser = {
            email: config.systemMessageUser,
            password: config.systemMessagePassword
        };
        promiseChain.push(util.createUserOnAuth(sysMessageUser));
        return Promise.all(promiseChain);
    })
    .then(() => loginAuth(testSuperAdmin.email, testSuperAdmin.password)
        .then((result) => {
            activeToken = result;
            return null;
        }))
    .then(() => { // Start the application.
        app = appGenerator.generate();
        return null;
    })
    .then(() => { // Create organization.
        mockAuth(testSuperAdmin.email, testSuperAdmin.scopes);
        const requestOptions = util.requestGenerator();
        requestOptions.url = config.domain + '/public/v0.2/organizations';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = {
            realm: organization.realm,
            name: organization.name,
        };
        return util.requestCall(requestOptions, 'create organization');
    })
    .then(() => { // Set search_path to new organization
        return db.sequelize.query('SET search_path TO ' + organization.realm);
    })
    .then(() => { // Invite admin.
        const requestOptions = util.requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = testAdmin;
        return util.requestCall(requestOptions, 'create admin')
            .then((result) => {
                console.log('JAMES2');
                console.log(result);
                adminActivationToken = result;
            });
    })
    .then(() => { // Activate admin.
        const requestOptions = util.requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/activate/' + adminActivationToken;
        requestOptions.json = testAdmin;
        return util.requestCall(requestOptions, 'activate admin');
    })
    .then(() => loginAuth(testAdmin.email, testAdmin.password)
        .then((result) => {
            console.log('JAMES3');
            console.log(result);
            activeToken = result;
            return null;
    }))
    .then(() => { // Invite users.
        const promiseChain = [];
        testUsers.forEach((user) => {
            const requestOptions = util.requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
            requestOptions.headers.authorization = activeToken;
            requestOptions.json = user;
            promiseChain.push(util.requestCall(requestOptions, 'create user'));
        });
        return Promise.all(promiseChain);
    })
    .then(() => { // Activate users.
        const promiseChain = [];
        testUsers.forEach((user, index) => {
            const requestOptions = util.requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm
                + '/v0.2/users/activate/' + userActivationTokens[index];
            requestOptions.json = user;
            promiseChain.push(util.requestCall(requestOptions, 'activate user'));
        });
        return Promise.all(promiseChain);
    })
    .then(() => {
        console.log('*********\nSeeding process complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.log('*********\nSeeding process failed with error:' + err);
        process.exit(1);
    });
