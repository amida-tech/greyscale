'use strict';

const _ = require('lodash');
const config = require('./config');
const models = require('./models');
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const schema = _.get(config, 'testEntities.organization.realm', 'public');
const db = models(config.pgConnect, ['sceleton']);
const appGenerator = require('./app/app-generator');

const essences = require('./test/fixtures/seed/essences_0');
const languages = require('./test/fixtures/seed/languages_0');
const rights = require('./test/fixtures/seed/rights_0');
const roles = require('./test/fixtures/seed/roles_0');
const roles1 = require('./test/fixtures/seed/roles_1');
const tokens = require('./test/fixtures/seed/tokens_0');
const users = require('./test/fixtures/seed/users_0');
const accessMatrices = require('./test/fixtures/seed/access-matrices_0');
const rolesRights = require('./test/fixtures/seed/roles-rights_0');
const unitOfAnalysisTypes = require('./test/fixtures/seed/unit-of-analysis-type_0');
const groups = require('./test/fixtures/seed/groups_0');
const organizations = require('./test/fixtures/seed/organizations_0');
const notifications = require('./test/fixtures/seed/notifications_0');
const productUoas = require('./test/fixtures/seed/product-uoas_0');
const products = require('./test/fixtures/seed/products_0');
const projects = require('./test/fixtures/seed/projects_0');
const unitOfAnalysis = require('./test/fixtures/seed/unit-of-analysis_0');
const workflows = require('./test/fixtures/seed/workflows_0');
const workflowSteps = require('./test/fixtures/seed/workflow-steps_0');
const workflowStepGroups = require('./test/fixtures/seed/workflow-step-groups_0');
const userGroups = require('./test/fixtures/seed/user-groups_0');
const tasks = require('./test/fixtures/seed/tasks_0');

const testSuperAdmin = config.testEntities.superAdmin;
const testAdmin = config.testEntities.admin;
const testUsers = config.testEntities.users;
const organization = config.testEntities.organization;
let activeToken = null;
let addToAuth = true;
let adminActivationToken = null;
const userActivationTokens = [];

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
            } else if (operation === 'create admin') {
                adminActivationToken = res.body.activationToken;
            } else if (operation === 'create user') {
                userActivationTokens.push(res.body.activationToken);
            }
            return Promise.resolve();
        })
        .catch((err) => {
            if (err.statusCode === 409 && operation === 'create authuser') {
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
    return requestCall(requestOptions, 'create authuser');
}

// There are a number of sequence setting elements that I do not understand
// readily. Rather than figure it out just yet, I'm copying what shared-integration.js
// does for the time being until we can examine it more closely.
function setSequenceValue(db, key, value, schema) {
    const query = `SELECT pg_catalog.setval('"${schema}"."${key}"', ${value}, true)`;
    return db.sequelize.query(query, { raw: true });
};

function seedSchemaCommon(db, schema) {
    return Promise.resolve()
        .then(() => db[schema].AccessMatrices.bulkCreate(accessMatrices))
        .then(() => setSequenceValue(db, 'AccessMatrices_id_seq', 8, schema))
        .then(() => setSequenceValue(db, 'AccessPermissions_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'AnswerAttachments_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Discussions_id_seq', 1, schema))
        .then(() => db[schema].Essences.bulkCreate(essences))
        .then(() => setSequenceValue(db, 'Essences_id_seq', 45, schema))
        .then(() => setSequenceValue(db, 'Indexes_id_seq', 1, schema))
        .then(() => db[schema].Languages.bulkCreate(languages))
        .then(() => setSequenceValue(db, 'Languages_id_seq', 13, schema))
        .then(() => setSequenceValue(db, 'Logs_id_seq', 1020, schema))
        .then(() => db[schema].Rights.bulkCreate(rights))
        .then(() => setSequenceValue(db, 'Rights_id_seq', 138, schema))
        .then(() => db[schema].Roles.bulkCreate(roles1))
        .then(() => setSequenceValue(db, 'Roles_id_seq', 3, schema))
        .then(() => db[schema].RolesRights.bulkCreate(rolesRights))
        .then(() => setSequenceValue(db, 'Subindexes_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisClassType_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisTagLink_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisTag_id_seq', 1, schema))
        .then(() => db[schema].UnitOfAnalysisType.bulkCreate(unitOfAnalysisTypes))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisType_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Visualizations_id_seq', 1, schema));
};

function seedSchema0(db, schema) {
    return Promise.resolve()
        .then(() => db.public.Users.bulkCreate(users))
        .then(() => setSequenceValue(db, 'Users_id_seq', 357, 'public'))
        .then(() => seedSchemaCommon(db, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysis_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Organizations_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Users_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Notifications_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Groups_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Products_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Projects_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Workflows_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'WorkflowSteps_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Tasks_id_seq', 1, schema));
};

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
    .then(() => db.public.Essences.bulkCreate(essences))
    .then(() => setSequenceValue(db, 'Essences_id_seq', 57, 'public'))
    .then(() => db.public.Languages.bulkCreate(languages))
    .then(() => setSequenceValue(db, 'Languages_id_seq', 13, 'public'))
    .then(() => setSequenceValue(db, 'Logs_id_seq', 2569, 'public'))
    .then(() => setSequenceValue(db, 'Notifications_id_seq', 4, 'public'))
    .then(() => db.public.Rights.bulkCreate(rights))
    .then(() => setSequenceValue(db, 'Rights_id_seq', 138, 'public'))
    .then(() => db.public.Roles.bulkCreate(roles))
    .then(() => setSequenceValue(db, 'Roles_id_seq', 16, 'public'))
    .then(() => db.public.Token.bulkCreate(tokens))
    .then(() => seedSchema0(db, 'sceleton'))
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
            promiseChain.push(createUserOnAuth(testSuperAdmin.email, testSuperAdmin.password, testSuperAdmin.scopes));
            promiseChain.push(createUserOnAuth(testAdmin.email, testAdmin.password, testAdmin.scopes));
            testUsers.forEach((user) => {
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
        mockAuth(testSuperAdmin.email, testSuperAdmin.scopes);
        const requestOptions = requestGenerator();
        requestOptions.url = config.domain + '/public/v0.2/organizations';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = {
            realm: organization.realm,
            name: organization.name,
        };
        return requestCall(requestOptions, 'create organization');
    })
    .then(() => { // Set search_path to new organization
        return db.sequelize.query('SET search_path TO ' + organization.realm);
    })
    .then(() => { // Invite admin.
        const requestOptions = requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
        requestOptions.headers.authorization = activeToken;
        requestOptions.json = testAdmin;
        return requestCall(requestOptions, 'create admin');
    })
    .then(() => { // Activate admin.
        const requestOptions = requestGenerator();
        requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/activate/' + adminActivationToken;
        requestOptions.json = testAdmin;
        return requestCall(requestOptions, 'activate admin');
    })
    .then(() => { // Login as admin.
        if(!addToAuth) {
            mockAuth(testAdmin.email, testAdmin.scopes);
            return null;
        }
        return loginAuth(testAdmin.email, testAdmin.password);
    })
    .then(() => { // Invite users.
        const promiseChain = [];
        testUsers.forEach((user) => {
            const requestOptions = requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm + '/v0.2/users/self/organization/invite';
            requestOptions.headers.authorization = activeToken;
            requestOptions.json = user;
            promiseChain.push(requestCall(requestOptions, 'create user'));
        });
        return Promise.all(promiseChain);
    })
    .then(() => { // Activate users.
        const promiseChain = [];
        console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
        console.log(userActivationTokens);
        testUsers.forEach((user, index) => {
            const requestOptions = requestGenerator();
            requestOptions.url = config.domain + '/' + organization.realm
                + '/v0.2/users/activate/' + userActivationTokens[index];
            requestOptions.json = user;
            promiseChain.push(requestCall(requestOptions, 'activate user'));
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
