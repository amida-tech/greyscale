'use strict';

const config = require('./config');
const request = require('request-promise');
const models = require('./models');
const db = models(config.pgConnect, ['sceleton']);

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
const unitOfAnalysis = require('./test/fixtures/seed/unit-of-analysis_0');
const workflows = require('./test/fixtures/seed/workflows_0');
const workflowSteps = require('./test/fixtures/seed/workflow-steps_0');
const workflowStepGroups = require('./test/fixtures/seed/workflow-step-groups_0');
const userGroups = require('./test/fixtures/seed/user-groups_0');
const tasks = require('./test/fixtures/seed/tasks_0');

// There are a number of sequence setting elements that I do not understand
// readily. Rather than figure it out just yet, I'm copying what shared-integration.js
// does for the time being until we can examine it more closely.
var setSequenceValue = function (db, key, value, schema) {
    const query = `SELECT pg_catalog.setval('"${schema}"."${key}"', ${value}, true)`;
    return db.sequelize.query(query, { raw: true });
}

var seedSchemaPublic = function (db) {
    return Promise.resolve()
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
}

var seedSchemaCommon = function (db, schema) {
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
}
var seedSchema0 = function (db, schema) {
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
}
var requestGenerator = function() {
    return ({
        method: 'POST',
        headers: {
            'origin': config.domain
        },
        resolveWithFullResponse: true,
    });
}
var requestCall = function (requestOptions, operation) {
    console.log(operation);
    return request(requestOptions)
        .then((res) => {
            return res.body;
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

var loginAuth = function (email, password) {
    const requestOptions = requestGenerator();
    requestOptions.url = config.authService + '/auth/login';
    requestOptions.json = {
        username: email,
        email,
        password,
    };
    return requestCall(requestOptions, 'login');
}

var createUserOnAuth = function (user, activeToken) {
    const requestOptions = requestGenerator();
    requestOptions.url = config.authService + '/user';

    requestOptions.json = {
        username: user.email,
        email: user.email,
        password: user.password,
    };
    if (user.scopes) {
        requestOptions.json.scopes = [user.scopes];
    }
    if (activeToken) {
        requestOptions.headers.authorization = activeToken;
    }
    return requestCall(requestOptions, 'create authuser');
}

var getUserInfo = function (email, activeToken) {
    const requestOptions = requestGenerator();
    requestOptions.method = 'GET';
    requestOptions.url = config.authService + '/user/byEmail/' + email;
    requestOptions.headers.authorization = activeToken;
    return requestCall(requestOptions, 'get user');
}

var updateScope = function(user, authid, activeToken) {
    const requestOptions = requestGenerator();
    requestOptions.url = config.authService + '/user/scopes/' + authid;
    requestOptions.method = 'PUT'
    requestOptions.headers.authorization = activeToken;
    requestOptions.json = {
        scopes: [user.scopes],
    };
    return requestCall(requestOptions, 'update scopes');
}

module.exports = {
    setSequenceValue,
    seedSchemaPublic,
    seedSchemaCommon,
    seedSchema0,
    requestGenerator,
    requestCall,
    loginAuth,
    createUserOnAuth,
    getUserInfo,
    updateScope
}
