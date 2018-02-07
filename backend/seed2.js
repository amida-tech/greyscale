'use strict';

process.env.NODE_ENV = 'test';

const config = require('./config');
const models = require('./models');

const db = models(config.pgConnect, ['sceleton', 'test']);

const essences = require('./test/fixtures/seed/essences_0');
const languages = require('./test/fixtures/seed/languages_0');
const rights = require('./test/fixtures/seed/rights_0');
const roles = require('./test/fixtures/seed/roles_0');
const roles1 = require('./test/fixtures/seed/roles_1');
const tokens = require('./test/fixtures/seed/tokens_0');
const users = require('./test/fixtures/seed/users_0');
const users1 = require('./test/fixtures/seed/users_1');
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

const setSequenceValue = function (key, value, schema) {
    const query = `SELECT pg_catalog.setval('"${schema}"."${key}"', ${value}, true)`;
    return db.sequelize.query(query, { raw: true });
}

const seedSchemaCommon = function (schema) {
    return Promise.resolve()
        .then(() => db[schema].AccessMatrices.bulkCreate(accessMatrices))
        .then(() => setSequenceValue('AccessMatrices_id_seq', 8, schema))
        .then(() => setSequenceValue('AccessPermissions_id_seq', 1, schema))
        .then(() => setSequenceValue('AnswerAttachments_id_seq', 1, schema))
        .then(() => setSequenceValue('Discussions_id_seq', 1, schema))
        .then(() => db[schema].Essences.bulkCreate(essences))
        .then(() => setSequenceValue('Essences_id_seq', 45, schema))
        .then(() => setSequenceValue('Indexes_id_seq', 1, schema))
        .then(() => db[schema].Languages.bulkCreate(languages))
        .then(() => setSequenceValue('Languages_id_seq', 13, schema))
        .then(() => setSequenceValue('Logs_id_seq', 1020, schema))
        .then(() => db[schema].Rights.bulkCreate(rights))
        .then(() => setSequenceValue('Rights_id_seq', 138, schema))
        .then(() => db[schema].Roles.bulkCreate(roles1))
        .then(() => setSequenceValue('Roles_id_seq', 3, schema))
        .then(() => db[schema].RolesRights.bulkCreate(rolesRights))
        .then(() => setSequenceValue('Subindexes_id_seq', 1, schema))
        .then(() => setSequenceValue('UnitOfAnalysisClassType_id_seq', 1, schema))
        .then(() => setSequenceValue('UnitOfAnalysisTagLink_id_seq', 1, schema))
        .then(() => setSequenceValue('UnitOfAnalysisTag_id_seq', 1, schema))
        .then(() => db[schema].UnitOfAnalysisType.bulkCreate(unitOfAnalysisTypes))
        .then(() => setSequenceValue('UnitOfAnalysisType_id_seq', 1, schema))
        .then(() => setSequenceValue('Visualizations_id_seq', 1, schema));
};

const seedSchema0 = function (schema) {
    return Promise.resolve()
        .then(() => db.public.Users.bulkCreate(users))
        .then(() => setSequenceValue('Users_id_seq', 357, 'public'))
        .then(() => seedSchemaCommon(schema))
        .then(() => setSequenceValue('UnitOfAnalysis_id_seq', 1, schema))
        .then(() => setSequenceValue('Organizations_id_seq', 1, schema))
        .then(() => setSequenceValue('Users_id_seq', 1, schema))
        .then(() => setSequenceValue('Notifications_id_seq', 1, schema))
        .then(() => setSequenceValue('Groups_id_seq', 1, schema))
        .then(() => setSequenceValue('Products_id_seq', 1, schema))
        .then(() => setSequenceValue('Projects_id_seq', 1, schema))
        .then(() => setSequenceValue('Workflows_id_seq', 1, schema))
        .then(() => setSequenceValue('WorkflowSteps_id_seq', 1, schema))
        .then(() => setSequenceValue('Tasks_id_seq', 1, schema));
};

const seedSchema1 = function (schema) {
    return Promise.resolve()
        .then(() => seedSchemaCommon(schema))
        .then(() => db[schema].Organizations.bulkCreate(organizations))
        .then(() => setSequenceValue('Organizations_id_seq', 2, schema))
        .then(() => db[schema].Users.bulkCreate(users1))
        .then(() => setSequenceValue('Users_id_seq', 4, schema))
        .then(() => db[schema].UnitOfAnalysis.bulkCreate(unitOfAnalysis))
        .then(() => setSequenceValue('UnitOfAnalysis_id_seq', 2, schema))
        .then(() => db[schema].Projects.bulkCreate(projects))
        .then(() => setSequenceValue('Projects_id_seq', 2, schema))
        .then(() => db[schema].Products.bulkCreate(products))
        .then(() => setSequenceValue('Products_id_seq', 2, schema))
        .then(() => db[schema].Workflows.bulkCreate(workflows))
        .then(() => setSequenceValue('Workflows_id_seq', 2, schema))
        .then(() => db[schema].WorkflowSteps.bulkCreate(workflowSteps))
        .then(() => setSequenceValue('WorkflowSteps_id_seq', 3, schema))
        .then(() => db[schema].ProductUOA.bulkCreate(productUoas))
        .then(() => db[schema].Notifications.bulkCreate(notifications))
        .then(() => setSequenceValue('Notifications_id_seq', 7, schema))
        .then(() => db[schema].Groups.bulkCreate(groups))
        .then(() => setSequenceValue('Groups_id_seq', 3, schema))
        .then(() => db[schema].WorkflowStepGroups.bulkCreate(workflowStepGroups))
        .then(() => db[schema].UserGroups.bulkCreate(userGroups))
        .then(() => db[schema].Tasks.bulkCreate(tasks))
        .then(() => setSequenceValue('Tasks_id_seq', 3, schema));
};

const syncAndSeed = function() {
     return Promise.resolve()
       .then(() => db.sequelize.sync({ force: true }))
        .then(() => db.public.Essences.bulkCreate(essences))
        .then(() => setSequenceValue('Essences_id_seq', 57, 'public'))
        .then(() => db.public.Languages.bulkCreate(languages))
        .then(() => setSequenceValue('Languages_id_seq', 13, 'public'))
        .then(() => setSequenceValue('Logs_id_seq', 2569, 'public'))
        .then(() => setSequenceValue('Notifications_id_seq', 4, 'public'))
        .then(() => db.public.Rights.bulkCreate(rights))
        .then(() => setSequenceValue('Rights_id_seq', 138, 'public'))
        .then(() => db.public.Roles.bulkCreate(roles))
        .then(() => setSequenceValue('Roles_id_seq', 16, 'public'))
        .then(() => db.public.Token.bulkCreate(tokens))
        .then(() => seedSchema0('sceleton'))
        .then(() => seedSchema1('test'));
};

syncAndSeed()
    .then(() => {
        console.log('success');
        process.exit(0);
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
        process.exit(1);
    });
