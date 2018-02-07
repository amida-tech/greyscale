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

const setSequenceValue = async function (key, value, schema) {
    const query = `SELECT pg_catalog.setval('"${schema}"."${key}"', ${value}, true)`;
    await db.sequelize.query(query, { raw: true });
}

const seedSchemaCommon = async function (schema) {
    await db[schema].AccessMatrices.bulkCreate(accessMatrices);

    await setSequenceValue('AccessMatrices_id_seq', 8, schema);

    await setSequenceValue('AccessPermissions_id_seq', 1, schema);

    await setSequenceValue('AnswerAttachments_id_seq', 1, schema);

    await setSequenceValue('Discussions_id_seq', 1, schema);

    await db[schema].Essences.bulkCreate(essences);
    await setSequenceValue('Essences_id_seq', 45, schema);

    await setSequenceValue('Indexes_id_seq', 1, schema);

    await db[schema].Languages.bulkCreate(languages);
    await setSequenceValue('Languages_id_seq', 13, schema);

    await setSequenceValue('Logs_id_seq', 1020, schema);

    await db[schema].Rights.bulkCreate(rights);
    await setSequenceValue('Rights_id_seq', 138, schema);

    await db[schema].Roles.bulkCreate(roles1);
    await setSequenceValue('Roles_id_seq', 3, schema);

    await db[schema].RolesRights.bulkCreate(rolesRights);

    await setSequenceValue('Subindexes_id_seq', 1, schema);

    await setSequenceValue('UnitOfAnalysisClassType_id_seq', 1, schema);

    await setSequenceValue('UnitOfAnalysisTagLink_id_seq', 1, schema);

    await setSequenceValue('UnitOfAnalysisTag_id_seq', 1, schema);

    await db[schema].UnitOfAnalysisType.bulkCreate(unitOfAnalysisTypes);
    await setSequenceValue('UnitOfAnalysisType_id_seq', 1, schema);

    await setSequenceValue('Visualizations_id_seq', 1, schema);
};

const seedSchema0 = async function (schema) {
    await db.public.Users.bulkCreate(users);
    await setSequenceValue('Users_id_seq', 357, 'public');

    await seedSchemaCommon(schema);

    await setSequenceValue('UnitOfAnalysis_id_seq', 1, schema);
    await setSequenceValue('Organizations_id_seq', 1, schema);
    await setSequenceValue('Users_id_seq', 1, schema);
    await setSequenceValue('Notifications_id_seq', 1, schema);
    await setSequenceValue('Groups_id_seq', 1, schema);
    await setSequenceValue('Products_id_seq', 1, schema);
    await setSequenceValue('Projects_id_seq', 1, schema);
    await setSequenceValue('Workflows_id_seq', 1, schema);
    await setSequenceValue('WorkflowSteps_id_seq', 1, schema);
    await setSequenceValue('Tasks_id_seq', 1, schema);
};

const seedSchema1 = async function (schema) {
    await seedSchemaCommon(schema);

    await db[schema].Organizations.bulkCreate(organizations);
    await setSequenceValue('Organizations_id_seq', 2, schema);

    await db[schema].Users.bulkCreate(users1);
    await setSequenceValue('Users_id_seq', 4, schema);

    await db[schema].UnitOfAnalysis.bulkCreate(unitOfAnalysis);
    await setSequenceValue('UnitOfAnalysis_id_seq', 2, schema);

    await db[schema].Projects.bulkCreate(projects);
    await setSequenceValue('Projects_id_seq', 2, schema);

    await db[schema].Products.bulkCreate(products);
    await setSequenceValue('Products_id_seq', 2, schema);

    await db[schema].Workflows.bulkCreate(workflows);
    await setSequenceValue('Workflows_id_seq', 2, schema);

    await db[schema].WorkflowSteps.bulkCreate(workflowSteps);
    await setSequenceValue('WorkflowSteps_id_seq', 3, schema);

    await db[schema].ProductUOA.bulkCreate(productUoas);

    await db[schema].Notifications.bulkCreate(notifications);
    await setSequenceValue('Notifications_id_seq', 7, schema);

    await db[schema].Groups.bulkCreate(groups);
    await setSequenceValue('Groups_id_seq', 3, schema);

    await db[schema].WorkflowStepGroups.bulkCreate(workflowStepGroups);

    await db[schema].UserGroups.bulkCreate(userGroups);

    await db[schema].Tasks.bulkCreate(tasks);
    await setSequenceValue('Tasks_id_seq', 3, schema);
};

const syncAndSeed = async function() {
    await db.sequelize.sync({ force: true });

    await db.public.Essences.bulkCreate(essences);
    await setSequenceValue('Essences_id_seq', 57, 'public');

    await db.public.Languages.bulkCreate(languages);
    await setSequenceValue('Languages_id_seq', 13, 'public');

    await setSequenceValue('Logs_id_seq', 2569, 'public');

    await setSequenceValue('Notifications_id_seq', 4, 'public');

    await db.public.Rights.bulkCreate(rights);
    await setSequenceValue('Rights_id_seq', 138, 'public');

    await db.public.Roles.bulkCreate(roles);

    await setSequenceValue('Roles_id_seq', 16, 'public');

    await db.public.Token.bulkCreate(tokens);

    await seedSchema0('sceleton');
    await seedSchema1('test');
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
