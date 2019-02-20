'use strict';

const appGenerator = require('../../app/app-generator');

const config = require('../../config');
const models = require('../../models');

const essences = require('../fixtures/seed/essences_0');
const languages = require('../fixtures/seed/languages_0');
const rights = require('../fixtures/seed/rights_0');
const roles = require('../fixtures/seed/roles_0');
const roles1 = require('../fixtures/seed/roles_1');
const tokens = require('../fixtures/seed/tokens_0');
const users = require('../fixtures/seed/users_0');
const users1 = require('../fixtures/seed/users_1');
const rolesRights = require('../fixtures/seed/roles-rights_0');
const unitOfAnalysisTypes = require('../fixtures/seed/unit-of-analysis-type_0');
const groups = require('../fixtures/seed/groups_0');
const organizations = require('../fixtures/seed/organizations_0');
const notifications = require('../fixtures/seed/notifications_0');
const productUoas = require('../fixtures/seed/product-uoas_0');
const products = require('../fixtures/seed/products_0');
const projects = require('../fixtures/seed/projects_0');
const unitOfAnalysis = require('../fixtures/seed/unit-of-analysis_0');
const workflows = require('../fixtures/seed/workflows_0');
const workflowSteps = require('../fixtures/seed/workflow-steps_0');
const workflowStepGroups = require('../fixtures/seed/workflow-step-groups_0');
const userGroups = require('../fixtures/seed/user-groups_0');
const tasks = require('../fixtures/seed/tasks_0');

const setSequenceValue = function (db, key, value, schema) {
    const query = `SELECT pg_catalog.setval('"${schema}"."${key}"', ${value}, true)`;
    return db.sequelize.query(query, { raw: true });
};

const seedSchemaCommon = function (db, schema) {
    return Promise.resolve()
        .then(() => setSequenceValue(db, 'AccessPermissions_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Discussions_id_seq', 1, schema))
        .then(() => db[schema].Essences.bulkCreate(essences))
        .then(() => setSequenceValue(db, 'Essences_id_seq', 45, schema))
        .then(() => db[schema].Languages.bulkCreate(languages))
        .then(() => setSequenceValue(db, 'Languages_id_seq', 13, schema))
        .then(() => setSequenceValue(db, 'Logs_id_seq', 1020, schema))
        .then(() => db[schema].Rights.bulkCreate(rights))
        .then(() => setSequenceValue(db, 'Rights_id_seq', 138, schema))
        .then(() => db[schema].Roles.bulkCreate(roles1))
        .then(() => setSequenceValue(db, 'Roles_id_seq', 3, schema))
        .then(() => db[schema].RolesRights.bulkCreate(rolesRights))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisClassType_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisTagLink_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisTag_id_seq', 1, schema))
        .then(() => db[schema].UnitOfAnalysisType.bulkCreate(unitOfAnalysisTypes))
        .then(() => setSequenceValue(db, 'UnitOfAnalysisType_id_seq', 1, schema))
        .then(() => setSequenceValue(db, 'Visualizations_id_seq', 1, schema));
};

const seedSchema0 = function (db, schema) {
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

const seedSchema1 = function (db, schema) {
    return Promise.resolve()
        .then(() => seedSchemaCommon(db, schema))
        .then(() => db[schema].Organizations.bulkCreate(organizations))
        .then(() => setSequenceValue(db, 'Organizations_id_seq', 2, schema))
        .then(() => db[schema].Users.bulkCreate(users1))
        .then(() => setSequenceValue(db, 'Users_id_seq', 4, schema))
        .then(() => db[schema].UnitOfAnalysis.bulkCreate(unitOfAnalysis))
        .then(() => setSequenceValue(db, 'UnitOfAnalysis_id_seq', 2, schema))
        .then(() => db[schema].Projects.bulkCreate(projects))
        .then(() => setSequenceValue(db, 'Projects_id_seq', 2, schema))
        .then(() => db[schema].Products.bulkCreate(products))
        .then(() => setSequenceValue(db, 'Products_id_seq', 2, schema))
        .then(() => db[schema].Workflows.bulkCreate(workflows))
        .then(() => setSequenceValue(db, 'Workflows_id_seq', 2, schema))
        .then(() => db[schema].WorkflowSteps.bulkCreate(workflowSteps))
        .then(() => setSequenceValue(db, 'WorkflowSteps_id_seq', 3, schema))
        .then(() => db[schema].ProductUOA.bulkCreate(productUoas))
        .then(() => db[schema].Notifications.bulkCreate(notifications))
        .then(() => setSequenceValue(db, 'Notifications_id_seq', 7, schema))
        .then(() => db[schema].Groups.bulkCreate(groups))
        .then(() => setSequenceValue(db, 'Groups_id_seq', 3, schema))
        .then(() => db[schema].WorkflowStepGroups.bulkCreate(workflowStepGroups))
        .then(() => db[schema].UserGroups.bulkCreate(userGroups))
        .then(() => db[schema].Tasks.bulkCreate(tasks))
        .then(() => setSequenceValue(db, 'Tasks_id_seq', 3, schema));
};

const syncAndSeed = function (db) {
    return Promise.resolve()
       .then(() => db.sequelize.sync({ force: true }))
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
        .then(() => seedSchema1(db, 'test'));
};

class SharedIntegration {
    constructor(indaSuperTest, hxUser) {
        this.indaSuperTest = indaSuperTest;
        this.hxUser = hxUser;
    }

    initialize(db) {
        return syncAndSeed(db)
            .then(() => {
                const app = appGenerator.generate();
                this.indaSuperTest.initialize(app);
            });
    }


    setupFn() {
        const that = this;
        const db = models(config.pgConnect, ['sceleton', 'test']);
        return function setUp() {
            return that.initialize(db);
        };
    }

    setupForSeedFn() {
        const that = this;
        const db = models(config.pgConnect, ['sceleton', 'test']);
        return function setUp() {
            const query = `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users'`;
            return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT })
                .then((result) => {
                    const count = result[0].count;
                    if ((count === 0) || (count === '0')) {
                        return that.initialize(db).then(() => true);
                    }
                    return false;
                });
        };
    }

    loginFn(user) {
        const indaSuperTest = this.indaSuperTest;
        return function login() {
            return indaSuperTest.authCommon(user);
        };
    }

    logoutFn() {
        const indaSuperTest = this.indaSuperTest;
        return function logout() {
            indaSuperTest.resetAuth();
        };
    }

    setupDb() {
        const db = models(config.pgConnect, ['sceleton', 'test']);
        return syncAndSeed(db);
    }
}

module.exports = SharedIntegration;
