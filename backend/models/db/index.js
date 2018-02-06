'use strict';

const essences = require('./essences.model');
const tasks = require('./tasks.model');
const languages = require('./languages.model');
const logs = require('./logs.model');
const notifications = require('./notifications.model')
const rights = require('./rights.model');
const roles = require('./roles.model');
const rolesRights = require('./roles-rights.model');
const token = require('./token.model');
const accessMatrices = require('./access-matrices.model');
const accessPermissions = require('./access-permissions.model');
const answerAttachments = require('./answer-attachments.model');
const attachmentAttempts = require('./attachment-attempts.model');
const attachmentLinks = require('./attachment-links.model');
const attachments = require('./attachments.model');
const discussions = require('./discussions.model');
const groups = require('./groups.model');
const indexQuestionWeights = require('./index-question-weights.model');
const indexSubindexWeights = require('./index-subindex-weights.model');
const indexes = require('./Indexes.model');
const organizations = require('./organizations.model');
const productUoa = require('./product-uoa.model');
const products = require('./products.model');
const projectUserGroups = require('./project-user-groups.model');
const projectUsers = require('./project-users.model');
const projects = require('./projects.model');
const subindexWeights = require('./subindex-weights.model');
const subindexes = require('./subindexes.model');
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

const defineTables = function (sequelize, Sequelize) {
    const Essences = essences(sequelize, Sequelize);
    const Languages= languages(sequelize, Sequelize);
    const Logs = logs(sequelize, Sequelize);
    const Notifications = notifications(sequelize, Sequelize);
    const Rights = rights(sequelize, Sequelize);
    const Roles = roles(sequelize, Sequelize);
    const RolesRights = rolesRights(sequelize, Sequelize);
    const Token = token(sequelize, Sequelize);
    const Users = users(sequelize, Sequelize);

    const AccessMatrices2 = accessMatrices(sequelize, Sequelize, 'sceleton');
    const AccessPermissions2 = accessPermissions(sequelize, Sequelize, 'sceleton');
    const AnswerAttachments2 = answerAttachments(sequelize, Sequelize, 'sceleton');
    const AttachmentAttempts2 = attachmentAttempts(sequelize, Sequelize, 'sceleton');
    const AttachmentLinks2 = attachmentLinks(sequelize, Sequelize, 'sceleton');
    const Attachments2 = attachments(sequelize, Sequelize, 'sceleton');
    const Discussions2 = discussions(sequelize, Sequelize, 'sceleton');
    const Essences2 = essences(sequelize, Sequelize, 'sceleton');
    const Groups2 = groups(sequelize, Sequelize, 'sceleton');
    const IndexQuestionWeights2 = indexQuestionWeights(sequelize, Sequelize, 'sceleton');
    const IndexSubindexWeights2 = indexSubindexWeights(sequelize, Sequelize, 'sceleton');
    const Indexes2 = indexes(sequelize, Sequelize, 'sceleton');
    const Languages2 = languages(sequelize, Sequelize, 'sceleton');
    const Logs2 = logs(sequelize, Sequelize, 'sceleton');
    const Notifications2 = notifications(sequelize, Sequelize, 'sceleton');
    const Organizations2 = organizations(sequelize, Sequelize, 'sceleton');
    const ProductUOA2 = productUoa(sequelize, Sequelize, 'sceleton');
    const Products2 = products(sequelize, Sequelize, 'sceleton');
    const ProjectUserGroups2 = projectUserGroups(sequelize, Sequelize, 'sceleton');
    const ProjectUsers2 = projectUsers(sequelize, Sequelize, 'sceleton');
    const Projects2 = projects(sequelize, Sequelize, 'sceleton');
    const Rights2 = rights(sequelize, Sequelize, 'sceleton');
    const Roles2 = roles(sequelize, Sequelize, 'sceleton');
    const RolesRights2 = rolesRights(sequelize, Sequelize, 'sceleton');
    const SubindexWeights2 = subindexWeights(sequelize, Sequelize, 'sceleton');
    const Subindexes2 = subindexes(sequelize, Sequelize, 'sceleton');
    const Tasks2 = tasks(sequelize, Sequelize, 'sceleton');
    const Translations2 = translations(sequelize, Sequelize, 'sceleton');
    const UnitOfAnalysis2 = unitOfAnalysis(sequelize, Sequelize, 'sceleton');
    const UnitOfAnalysisClassType2 = unitOfAnalysisClassType(sequelize, Sequelize, 'sceleton');
    const UnitOfAnalysisTag2 = unitOfAnalysisTag(sequelize, Sequelize, 'sceleton');
    const UnitOfAnalysisTagLink2 = unitOfAnalysisTagLink(sequelize, Sequelize, 'sceleton');
    const UnitOfAnalysisType2 = unitOfAnalysisType(sequelize, Sequelize, 'sceleton');
    const UserGroups2 = userGroups(sequelize, Sequelize, 'sceleton');
    const UserRights2 = userRights(sequelize, Sequelize, 'sceleton');
    const UserUOA2 = userUOA(sequelize, Sequelize, 'sceleton');
    const Users2 = users(sequelize, Sequelize, 'sceleton');
    const Visualizations2 = visualizations(sequelize, Sequelize, 'sceleton');
    const WorkflowStepGroups2 = workflowStepGroups(sequelize, Sequelize, 'sceleton');
    const WorkflowSteps2 = workflowSteps(sequelize, Sequelize, 'sceleton');
    const Workflows2 = workflows(sequelize, Sequelize, 'sceleton');

    ProjectUserGroups2.removeAttribute('id');
    ProjectUsers2.removeAttribute('id');

    const AccessMatrices3 = accessMatrices(sequelize, Sequelize, 'test');
    const AccessPermissions3 = accessPermissions(sequelize, Sequelize, 'test');
    const AnswerAttachments3 = answerAttachments(sequelize, Sequelize, 'test');
    const AttachmentAttempts3 = attachmentAttempts(sequelize, Sequelize, 'test');
    const AttachmentLinks3 = attachmentLinks(sequelize, Sequelize, 'test');
    const Attachments3 = attachments(sequelize, Sequelize, 'test');
    const Discussions3 = discussions(sequelize, Sequelize, 'test');
    const Essences3 = essences(sequelize, Sequelize, 'test');
    const Groups3 = groups(sequelize, Sequelize, 'test');
    const IndexQuestionWeights3 = indexQuestionWeights(sequelize, Sequelize, 'test');
    const IndexSubindexWeights3 = indexSubindexWeights(sequelize, Sequelize, 'test');
    const Indexes3 = indexes(sequelize, Sequelize, 'test');
    const Languages3 = languages(sequelize, Sequelize, 'test');
    const Logs3 = logs(sequelize, Sequelize, 'test');
    const Notifications3 = notifications(sequelize, Sequelize, 'test');
    const Organizations3 = organizations(sequelize, Sequelize, 'test');
    const ProductUOA3 = productUoa(sequelize, Sequelize, 'test');
    const Products3 = products(sequelize, Sequelize, 'test');
    const ProjectUserGroups3 = projectUserGroups(sequelize, Sequelize, 'test');
    const ProjectUsers3 = projectUsers(sequelize, Sequelize, 'test');
    const Projects3 = projects(sequelize, Sequelize, 'test');
    const Rights3 = rights(sequelize, Sequelize, 'test');
    const Roles3 = roles(sequelize, Sequelize, 'test');
    const RolesRights3 = rolesRights(sequelize, Sequelize, 'test');
    const SubindexWeights3 = subindexWeights(sequelize, Sequelize, 'test');
    const Subindexes3 = subindexes(sequelize, Sequelize, 'test');
    const Tasks3 = tasks(sequelize, Sequelize, 'test');
    const Translations3 = translations(sequelize, Sequelize, 'test');
    const UnitOfAnalysis3 = unitOfAnalysis(sequelize, Sequelize, 'test');
    const UnitOfAnalysisClassType3 = unitOfAnalysisClassType(sequelize, Sequelize, 'test');
    const UnitOfAnalysisTag3 = unitOfAnalysisTag(sequelize, Sequelize, 'test');
    const UnitOfAnalysisTagLink3 = unitOfAnalysisTagLink(sequelize, Sequelize, 'test');
    const UnitOfAnalysisType3 = unitOfAnalysisType(sequelize, Sequelize, 'test');
    const UserGroups3 = userGroups(sequelize, Sequelize, 'test');
    const UserRights3 = userRights(sequelize, Sequelize, 'test');
    const UserUOA3 = userUOA(sequelize, Sequelize, 'test');
    const Users3 = users(sequelize, Sequelize, 'test');
    const Visualizations3 =  visualizations(sequelize, Sequelize, 'test');
    const WorkflowStepGroups3 = workflowStepGroups(sequelize, Sequelize, 'test');
    const WorkflowSteps3 = workflowSteps(sequelize, Sequelize, 'test');
    const Workflows3 = workflows(sequelize, Sequelize, 'test');

    ProjectUserGroups3.removeAttribute('id');
    ProjectUsers3.removeAttribute('id');

    return {
        sequelize,
        Essences,
        Languages,
        Logs,
        Notifications,
        Rights,
        Roles,
        RolesRights,
    };
};

module.exports = defineTables;
