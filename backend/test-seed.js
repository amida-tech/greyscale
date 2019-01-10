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

let authAdminToken = null;
let activeToken = null;
let adminActivationToken = null;
let authid = null;
let app = null;
const userActivationTokens = [];

Promise.resolve()
    .then(() => {
        if (process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD) {
            console.log('*********\nAdmin password provided. Using to create users on auth service.\n');
            return util.loginAuth(process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME, process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD)
                .then((result) => {
                    authAdminToken = 'Bearer ' + result.token;
                    return null;
                });
        } else if (process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration true. Creating users on auth service.\n');
        } else {
            console.log('*********\nNo means to create users on auth service detected. Exiting.\n');
            process.exit(0);
        }
    })
    .then(() => util.loginAuth(testSuperAdmin.email, testSuperAdmin.password)
        .then((result) => {
            activeToken = 'Bearer ' + result.token;
            return null;
        }))
    // .then(() => { // Start the application.
    //     app = appGenerator.generate();
    //     return null;
    // })
    .then(() => { // Create organization.
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
                adminActivationToken = result.activationToken;
            });
    })
    .then(() => { // Activate admin.
        const requestOptions = util.requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/activate/' + adminActivationToken;
        requestOptions.json = testAdmin;
        return util.requestCall(requestOptions, 'activate admin');
    })
    .then(() => util.getUserInfo(testAdmin.email, authAdminToken) // Get admin id and update scope
        .then((result) => {
            if (typeof result === 'string') {
                let jsonResult = JSON.parse(result);
                authid = jsonResult.id;
            } else {
                authid = result.id;
            }
            return null;
        }))
    .then(() => util.updateScope(testAdmin, authid, activeToken))
    .then(() => util.loginAuth(testAdmin.email, testAdmin.password)
        .then((result) => {
            activeToken = 'Bearer ' + result.token;
            return null;
    }))
    .then(() => { // Invite users.
        const promiseChain = [];
        testUsers.forEach((user) => {
            const requestOptions = util.requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
            requestOptions.headers.authorization = activeToken;
            requestOptions.json = user;
            promiseChain.push(util.requestCall(requestOptions, 'create user')
                .then((result) => {
                    userActivationTokens.push(result);
                }));
        });
        return Promise.all(promiseChain);
    })
    .then(() => { // Activate users.
        const promiseChain = [];
        userActivationTokens.forEach((user, index) => {
            const requestOptions = util.requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm
                + '/v0.2/users/activate/' + user.activationToken;
            requestOptions.json = testUsers.find((testUser) => testUser.email === user.email);
            requestOptions.json.authId = user.id;
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
