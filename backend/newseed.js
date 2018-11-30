'use strict';

const _ = require('lodash');
const config = require('./config');
const models = require('./models');
const request = require('request-promise');
const schema = _.get(config, 'testEntities.organization.realm', 'public');
const db = models(config.pgConnect, ['sceleton', 'test']);

const superAdmin = config.testEntities.superAdmin;
const admin = config.testEntities.admin;
const users = config.testEntities.users;
const organization = config.testEntities.organization;
let activeToken = null;
let addToAuth = true;

// Add '--blank' to create database without test users.
function loginAuthAdmin() {
    const requestOptions = {
        url: config.authService + '/auth/login',
        method: 'POST',
        headers: {
            'origin': config.domain
        },
        json: {
            username: process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME,
            email: process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME,
            password: process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD,
        },
        resolveWithFullResponse: true,
    };
    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                console.log('*********\nAdmin authentication failed. Check your username and password, or .env settings.\n');
                return Promise.reject(httpErr);
            }
            activeToken = 'Bearer ' + res.body.token;
            return Promise.resolve();
        })
        .catch((err) => {
            console.log('*********\nContacting the auth service failed. Check if it\'s up.\n');
            return Promise.reject(httpErr);
        });
}

function createUserOnAuth(email, password, scopes) {
    const requestOptions = {
        url: config.authService + '/user',
        method: 'POST',
        headers: {
            'origin': config.domain
        },
        json: {
            username: email,
            email,
            password,
        },
        resolveWithFullResponse: true,
    };
    if (scopes) {
        requestOptions.json.scopes = [scopes];
    }
    if (activeToken) {
        requestOptions.headers.authorization = activeToken;
    }
    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                console.log('*********\nInsertion failed for ' + email + '.\n');
                return Promise.reject(httpErr);
            }
            return Promise.resolve();
        })
        .catch((err) => {
            console.log('*********\nContacting the auth service failed. Check if it\'s up.\n');
            return Promise.reject(httpErr);
        });
}

db.sequelize.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users'`, { type: db.sequelize.QueryTypes.SELECT })
    .then((result) => {
        if(result[0].count === '0') {
            console.log('*********\nDatabase empty. Proceeding with initialization.');
            console.log('Procedure will ' +(process.argv.includes('--blank') ? 'not ' : '')
                + 'create test users.\n');
            return db.sequelize.sync({ force: true });
        }
        console.log('*********\nThe tables are already initialized. If this is an error, please drop and recreate the database.');
        process.exit(0);
    })
    .then(() => {
        if (process.argv.includes('--blank')) {
            addToAuth = false;
            return null;
        }
        if (process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD) {
            console.log('*********\nAdmin password provided. Using to create users on auth service.\n');
            return loginAuthAdmin();
        } else if (process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration true. Creating users on auth service.\n');
        } else {
            console.log('*********\nNo means to create users on auth service detected. Only creating them in Indaba.\n');
            addToAuth = false;
        }
    })
    .then(() => {
        if(addToAuth) {
            const promiseChain = [];
            promiseChain.push(createUserOnAuth(superAdmin.email, superAdmin.password, superAdmin.scopes));
            promiseChain.push(createUserOnAuth(admin.email, admin.password, admin.scopes));
            users.forEach((user) => {
                promiseChain.push(createUserOnAuth(user.email, user.password));
            });
            return Promise.all(promiseChain);
        }
        return null;
    })
    .then(() => {
        console.log('*********\nSeeding process complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.log('*********\nSeeding process failed with error:' + err);
        process.exit(1);
    });
