'use strict';

const _ = require('lodash');
const config = require('./config');
const models = require('./models');
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const schema = _.get(config, 'testEntities.organization.realm', 'public');
const db = models(config.pgConnect, ['sceleton', 'test']);
const appGenerator = require('./app/app-generator');

const superAdmin = config.testEntities.superAdmin;
const admin = config.testEntities.admin;
const users = config.testEntities.users;
const organization = config.testEntities.organization;
let activeToken = null;
let addToAuth = true;

// Add '--blank' to create database without test users.
function requestGenerator() {
    return ({
        method: 'POST',
        headers: {
            'origin': config.domain
        },
        resolveWithFullResponse: true,
    });
};

function requestCall(requestOptions, operation) {
    return request(requestOptions)
        .then((res) => {
            if (operation === 'login') {
                activeToken = 'Bearer ' + res.body.token;
            }
            return Promise.resolve();
        })
        .catch((err) => {
            if (err.statusCode === 409 && operation === 'create user') {
                console.log('*********\nUser ' + requestOptions.json.username + ' already in auth service.\n');
                return Promise.resolve();
            }
            console.log('*********\nFailed to connect with one of the services.\n');
            return Promise.reject(err);
        });
}

function loginAuth(email, password) {
    const requestOptions = requestGenerator();
    requestOptions.url = config.authService + '/auth/login';
    requestOptions.json = {
        username: email,
        email,
        password,
    };
    return requestCall(requestOptions, 'login');
}

function mockAuth(email, scopes) {
    const payload = {
        username: email,
        email,
        scopes: [scopes],
    };
    activeToken = 'Bearer ' + jwt.sign(payload, config.jwtSecret);
}

function createUserOnAuth(email, password, scopes) {
    const requestOptions = requestGenerator();
    requestOptions.url = config.authService + '/user';
    requestOptions.json = {
        username: email,
        email,
        password,
    };
    if (scopes) {
        requestOptions.json.scopes = [scopes];
    }
    if (activeToken) {
        requestOptions.headers.authorization = activeToken;
    }
    return requestCall(requestOptions, 'create user');
}

db.sequelize.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users'`, { type: db.sequelize.QueryTypes.SELECT })
    .then((result) => {
        if(result[0].count === '0') {
            console.log('*********\nDatabase empty. Proceeding with initialization.');
            console.log('Procedure will ' +(process.argv.includes('--blank') ? 'not ' : '') + 'create test users and organization.\n');
            return db.sequelize.sync({ force: true });
        }
        console.log('*********\nThe tables are already initialized. If this is an error, please drop and recreate the database.');
        process.exit(0);
    })
    .then(() => {
        if (process.argv.includes('--blank')) {
            console.log('*********\nSeeding process complete.');
            process.exit(0);
        }
        if (process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD) {
            console.log('*********\nAdmin password provided. Using to create users on auth service.\n');
            return loginAuth(process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME, process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD);
        } else if (process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration true. Creating users on auth service.\n');
        } else {
            console.log('*********\nNo means to create users on auth service detected. Only creating them in Indaba.\n');
        }
    })
    .then(() => { // Add users to auth if available.
        if(addToAuth) {
            const promiseChain = [];
            promiseChain.push(createUserOnAuth(superAdmin.email, superAdmin.password, superAdmin.scopes));
            promiseChain.push(createUserOnAuth(admin.email, admin.password, admin.scopes));
            users.forEach((user) => {
                promiseChain.push(createUserOnAuth(user.email, user.password));
            });
            promiseChain.push(createUserOnAuth(config.systemMessageUser, config.systemMessagePassword));
            return Promise.all(promiseChain);
        }
        return null;
    })
    .then(() => { // Start the application.
        return appGenerator.generate();
    })
    .then(() => { // Create organization.
        mockAuth(superAdmin.email, superAdmin.scopes);
        const requestOptions = requestGenerator();
        requestOptions.url = config.domain + '/public/v0.2/organizations';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = {
            realm: organization.realm,
        };
        console.log(requestOptions);
        return requestCall(requestOptions, 'create organization');
    })
    .then(() => { // Set search_path to new organization
        return db.sequelize.query('SET search_path TO ' + organization.realm);
    })
    .then(() => { // Invite admin.
        const requestOptions = requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = admin;
        return requestCall(requestOptions, 'create admin');
    })
    .then(() => { // Login as admin.
        if(!addToAuth) {
            mockAuth(admin.email, admin.scopes);
            return null;
        }
        return loginAuth(admin.email, admin.scopes);
    })
    .then(() => {
        console.log('*********\nSeeding process complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.log('*********\nSeeding process failed with error:' + err);
        process.exit(1);
    });
