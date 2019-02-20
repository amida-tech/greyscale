'use strict';

const essences = require('./essences.model');
const tasks = require('./tasks.model');
const languages = require('./languages.model');
const logs = require('./logs.model');
const notifications = require('./notifications.model');
const rights = require('./rights.model');
const roles = require('./roles.model');
const rolesRights = require('./roles-rights.model');
const token = require('./token.model');
const accessPermissions = require('./access-permissions.model');
const discussions = require('./discussions.model');
const groups = require('./groups.model');
const organizations = require('./organizations.model');
const productUoa = require('./product-uoa.model');
const products = require('./products.model');
const projectUserGroups = require('./project-user-groups.model');
const projectUsers = require('./project-users.model');
const projects = require('./projects.model');
const translations = require('./translations.model');
const unitOfAnalysis = require('./unit-of-analysis.model');
const unitOfAnalysisClassType = require('./unit-of-analysis-class-type.model');
const unitOfAnalysisTag = require('./unit-of-analysis-tag.model');
const unitOfAnalysisTagLink = require('./unit-of-analysis-tag-link.model');
const unitOfAnalysisType = require('./unit-of-analysis-type.model');
const userGroups = require('./user-groups.model');
const userRights = require('./user-rights.model');
const userUOA = require('./user-uoa.model');
const users = require('./users.model');
const visualizations = require('./visualizations.model');
const workflowStepGroups = require('./workflow-step-groups.model');
const workflowSteps = require('./workflow-steps.model');
const workflows = require('./workflows.model');

const definePublicTables = function (sequelize, Sequelize) {
    const Essences = essences(sequelize, Sequelize);
    const Languages = languages(sequelize, Sequelize);
    const Logs = logs(sequelize, Sequelize);
    const Notifications = notifications(sequelize, Sequelize);
    const Rights = rights(sequelize, Sequelize);
    const Roles = roles(sequelize, Sequelize);
    const RolesRights = rolesRights(sequelize, Sequelize);
    const Token = token(sequelize, Sequelize);
    const Users = users(sequelize, Sequelize);

    return {
        Essences,
        Languages,
        Logs,
        Notifications,
        Rights,
        Roles,
        RolesRights,
        Token,
        Users,
    };
};

const defineSchemaTables = function (sequelize, Sequelize, schema) {
    const AccessPermissions = accessPermissions(sequelize, Sequelize, schema);
    const Discussions = discussions(sequelize, Sequelize, schema);
    const Essences = essences(sequelize, Sequelize, schema);
    const Groups = groups(sequelize, Sequelize, schema);
    const Languages = languages(sequelize, Sequelize, schema);
    const Logs = logs(sequelize, Sequelize, schema);
    const Notifications = notifications(sequelize, Sequelize, schema);
    const Organizations = organizations(sequelize, Sequelize, schema);
    const ProductUOA = productUoa(sequelize, Sequelize, schema);
    const Products = products(sequelize, Sequelize, schema);
    const ProjectUserGroups = projectUserGroups(sequelize, Sequelize, schema);
    const ProjectUsers = projectUsers(sequelize, Sequelize, schema);
    const Projects = projects(sequelize, Sequelize, schema);
    const Rights = rights(sequelize, Sequelize, schema);
    const Roles = roles(sequelize, Sequelize, schema);
    const RolesRights = rolesRights(sequelize, Sequelize, schema);
    const Tasks = tasks(sequelize, Sequelize, schema);
    const Translations = translations(sequelize, Sequelize, schema);
    const UnitOfAnalysis = unitOfAnalysis(sequelize, Sequelize, schema);
    const UnitOfAnalysisClassType = unitOfAnalysisClassType(sequelize, Sequelize, schema);
    const UnitOfAnalysisTag = unitOfAnalysisTag(sequelize, Sequelize, schema);
    const UnitOfAnalysisTagLink = unitOfAnalysisTagLink(sequelize, Sequelize, schema);
    const UnitOfAnalysisType = unitOfAnalysisType(sequelize, Sequelize, schema);
    const UserGroups = userGroups(sequelize, Sequelize, schema);
    const UserRights = userRights(sequelize, Sequelize, schema);
    const UserUOA = userUOA(sequelize, Sequelize, schema);
    const Users = users(sequelize, Sequelize, schema);
    const Visualizations = visualizations(sequelize, Sequelize, schema);
    const WorkflowStepGroups = workflowStepGroups(sequelize, Sequelize, schema);
    const WorkflowSteps = workflowSteps(sequelize, Sequelize, schema);
    const Workflows = workflows(sequelize, Sequelize, schema);

    ProjectUserGroups.removeAttribute('id');
    ProjectUsers.removeAttribute('id');

    return {
        AccessPermissions,
        Discussions,
        Essences,
        Groups,
        Languages,
        Logs,
        Notifications,
        Organizations,
        ProductUOA,
        Products,
        ProjectUserGroups,
        ProjectUsers,
        Projects,
        Rights,
        Roles,
        RolesRights,
        Tasks,
        Translations,
        UnitOfAnalysis,
        UnitOfAnalysisClassType,
        UnitOfAnalysisTag,
        UnitOfAnalysisTagLink,
        UnitOfAnalysisType,
        UserGroups,
        UserRights,
        UserUOA,
        Users,
        Visualizations,
        WorkflowStepGroups,
        WorkflowSteps,
        Workflows,
    };
};

const defineTables = function (sequelize, Sequelize, schemas) {
    const publicTables = definePublicTables(sequelize, Sequelize);
    const tableObjects = schemas.reduce((r, schema) => {
        const tables = defineSchemaTables(sequelize, Sequelize, schema);
        r[schema] = tables;
        return r;
    }, {});

    return Object.assign({
        sequelize,
        public: publicTables,
    }, tableObjects);
};

module.exports = defineTables;
