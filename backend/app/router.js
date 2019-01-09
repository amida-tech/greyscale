var express = require('express'),
    authenticate = require('./auth').authenticate,
    checkRight = require('./auth').checkRight,
    config = require('../config'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json({
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        limit: config.max_upload_filesize
    });

const baseURL = `/:realm/v${config.version}`;

//----------------------------------------------------------------------------------------------------------------------
//    ROLES
//----------------------------------------------------------------------------------------------------------------------
var roles = require('./controllers/roles');

router.route(`${baseURL}/roles`)
    .get(authenticate('jwt').ifPossible, roles.select)
    .post(authenticate('jwt').ifPossible, jsonParser, roles.insertOne);

router.route(`${baseURL}/roles/:id`)
    .get(authenticate('jwt').ifPossible, roles.selectOne)
    .put(authenticate('jwt').ifPossible, jsonParser, roles.updateOne)
    .delete(authenticate('jwt').ifPossible, roles.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var rights = require('./controllers/rights');

router.route(`${baseURL}/rights`)
    .get(authenticate('jwt').always, checkRight('rights_view_all'), rights.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('rights_add_one'), rights.insertOne);

router.route(`${baseURL}/rights/:id`)
    .get(authenticate('jwt').always, checkRight('rights_view_one'), rights.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('rights_edit_one'), rights.updateOne)
    .delete(authenticate('jwt').always, checkRight('rights_delete_one'), rights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ROLE RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var roleRights = require('./controllers/role_rights');

router.route(`${baseURL}/roles/:roleID/rights`)
    .get(authenticate('jwt').always, checkRight('role_rights_view_one'), roleRights.select);

router.route(`${baseURL}/roles/:roleID/rights/:rightID`)
    .post(authenticate('jwt').always, jsonParser, checkRight('role_rights_add'), roleRights.insertOne)
    .delete(authenticate('jwt').always, checkRight('role_rights_delete'), roleRights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCES
//----------------------------------------------------------------------------------------------------------------------
var essences = require('./controllers/essences');

router.route(`${baseURL}/essences`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essences.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essences.insertOne);

router.route(`${baseURL}/essences/:id`)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essences.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    PROJECTS
//----------------------------------------------------------------------------------------------------------------------
var projects = require('./controllers/projects');

router.route(`${baseURL}/projects`)
    .get(authenticate('jwt').always, projects.listAll)
    .post(authenticate('jwt').always, jsonParser, projects.insertOne);

router.route(`${baseURL}/projects/:projectId/users`)
    .post(authenticate('jwt').always, jsonParser, projects.userAssignment);

router.route(`${baseURL}/projects/:projectId/users/:userId`)
    .delete(authenticate('jwt').always, projects.userRemoval);

router.route(`${baseURL}/projects/:id`)
    .get(authenticate('jwt').always, projects.selectOne)
    .delete(authenticate('jwt').always, projects.delete)
    .put(authenticate('jwt').always, jsonParser, projects.editOne);

router.route(`${baseURL}/projects/:id/products`)
    .get(authenticate('jwt').always, projects.productList);

router.route(`${baseURL}/projects/:id/surveys`)
    .get(authenticate('jwt').always, projects.surveyList);

router.route(`${baseURL}/projects/survey/:id`)
    .put(authenticate('jwt').always, jsonParser, projects.editSurvey);

//----------------------------------------------------------------------------------------------------------------------
//    SURVEYS
//----------------------------------------------------------------------------------------------------------------------
var surveys = require('./controllers/surveys');

router.route(`${baseURL}/surveys`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.insertOne);

router.route(`${baseURL}/surveys/:id`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.editOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.delete);

router.route(`${baseURL}/surveys/:id/questions`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.questions)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionAdd);

router.route(`${baseURL}/questions/:id`)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionEdit)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.questionDelete);

//----------------------------------------------------------------------------------------------------------------------
//    SURVEY ANSWERS
//----------------------------------------------------------------------------------------------------------------------
var surveyAnswers = require('./controllers/survey_answers');

router.route(`${baseURL}/survey_answers`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.add);

router.route(`${baseURL}/survey_answers/:productId/:UOAid`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.getByProdUoa);

router.route(`${baseURL}/survey_answers/:id`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.selectOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.delete)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.update);

//----------------------------------------------------------------------------------------------------------------------
//    ATTACHMENTS (universal mechanism)
//----------------------------------------------------------------------------------------------------------------------

var attachments = require('./controllers/attachments');

router.route(`${baseURL}/uploads/links/:essenceId/:entityId`)
    .put(authenticate('jwt').always, jsonParser, attachments.links);

router.route(`${baseURL}/uploads/:id/ticket`)
    .get(authenticate('jwt').always, attachments.getTicket);

router.route(`${baseURL}/uploads/:id/:essenceId/:entityId`)
    .delete(authenticate('jwt').always, attachments.delete);

router.route(`${baseURL}/uploads/upload_link`)
    .post(authenticate('jwt').always, jsonParser, attachments.getUploadLink);

router.route(`${baseURL}/uploads/success`)
    .post(authenticate('jwt').always, jsonParser, attachments.uploadSuccess);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCE_ROLES
//----------------------------------------------------------------------------------------------------------------------
var essenceRoles = require('./controllers/essence_roles');

router.route(`${baseURL}/essence_roles`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.insertOne);

router.route(`${baseURL}/essence_roles/:id`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.delete);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_MATRICES
//-----------------------------------------------s-----------------------------------------------------------------------
var accessMatrices = require('./controllers/access_matrices');

router.route(`${baseURL}/access_matrices`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.insertOne);

router.route(`${baseURL}/access_matrices/:id/permissions`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsSelect);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_PERMISSIONS
//----------------------------------------------------------------------------------------------------------------------
router.route(`${baseURL}/access_permissions`)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsInsertOne);

router.route(`${baseURL}/access_permissions/:id`)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsDeleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    LANGUAGES
//----------------------------------------------------------------------------------------------------------------------
var languages = require('./controllers/languages');

router.route(`${baseURL}/languages`)
    .get( /*authenticate('token').always, */ languages.select)
    .post(authenticate('jwt').always, jsonParser, languages.insertOne);

router.route(`${baseURL}/languages/:id`)
    .get(authenticate('jwt').always, languages.selectOne)
    .put(authenticate('jwt').always, jsonParser, languages.editOne)
    .delete(authenticate('jwt').always, languages.delete);

//----------------------------------------------------------------------------------------------------------------------
//    TASKS
//----------------------------------------------------------------------------------------------------------------------
var tasks = require('./controllers/tasks');

router.route(`${baseURL}/tasks`)
    .get(authenticate('jwt').always, tasks.select)
    .post(authenticate('jwt').always, jsonParser, tasks.insertOne);

router.route(`${baseURL}/tasks/:id`)
    .get(authenticate('jwt').always, tasks.selectOne)
    .put(authenticate('jwt').always, jsonParser, tasks.updateOne)
    .delete(authenticate('jwt').always, tasks.delete);

router.route(`${baseURL}/tasks-by-proj-id/:id`)
    .get(authenticate('jwt').always, checkRight('rights_view_all'), tasks.getTasksByProjectId);

router.route(`${baseURL}/tasks-by-user-id/:id`)
    .get(authenticate('jwt').always, tasks.getTasksByUserId);

router.route(`${baseURL}/tasks-self`)
    .get(authenticate('jwt').always, tasks.getSelfTasks);

//----------------------------------------------------------------------------------------------------------------------
//    TRANSLATIONS
//----------------------------------------------------------------------------------------------------------------------
var translations = require('./controllers/translations');
router.route(`${baseURL}/translations`)
    .get(authenticate('jwt').always, translations.select)
    .post(authenticate('jwt').always, jsonParser, translations.insertOne);

router.route(`${baseURL}/translations/:essenceId/:entityId/:field/:langId`)
    .delete(authenticate('jwt').always, /*checkPermission('product_delete','products'),*/ translations.delete)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_delete','products'),*/ translations.editOne);

router.route(`${baseURL}/translations/:essenceId`)
    .get(authenticate('jwt').always, translations.selectByParams);

router.route(`${baseURL}/translations/:essenceId/:entityId`)
    .get(authenticate('jwt').always, translations.selectByParams);
//----------------------------------------------------------------------------------------------------------------------
//    PRODUCTS
//----------------------------------------------------------------------------------------------------------------------
var products = require('./controllers/products');
router.route(`${baseURL}/products`)
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ products.select)
    .post(authenticate('jwt').always, jsonParser, products.insertOne);

router.route(`${baseURL}/products/:id`)
    .get(authenticate('jwt').always, /*checkPermission('product_select', 'products'),*/ products.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.updateOne)
    .delete(authenticate('jwt').always, /*checkPermission('product_delete', 'products'),*/ products.delete);

router.route(`${baseURL}/products/:id/tasks`)
    .get(authenticate('jwt').always, /*checkPermission('product_select', 'products'),*/ products.tasks)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_select', 'products'),*/ products.editTasks);

router.route(`${baseURL}/products/:id/aggregate`)
    .get( /*authenticate('token').always,*/ products.aggregateIndexes);

router.route(`${baseURL}/products/:id/aggregate.csv`)
    .get( /*authenticate('jwt').always,*/ products.aggregateIndexesCsv);

router.route(`${baseURL}/products/:id/indexes`)
    .get( /*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.indexes)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editIndexes);

router.route(`${baseURL}/products/:id/subindexes`)
    .get( /*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.subindexes)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editSubindexes);

router.route(`${baseURL}/products/:productId/export.csv`)
    .get( authenticate('jwt').always, products.export);

router.route(`${baseURL}/products/:id/export_ticket`)
    .get( /*authenticate('jwt').always,*/ products.getTicket);

router.route(`${baseURL}/products/:id/uoa`)
    .get(authenticate('jwt').always, checkRight('product_uoa'), products.UOAselect)
    .post(authenticate('jwt').always, jsonParser, checkRight('product_uoa'), products.UOAaddMultiple);

router.route(`${baseURL}/products/:id/uoa/:uoaid`)
    .delete(authenticate('jwt').always, checkRight('product_uoa'), products.UOAdelete)
    .post(authenticate('jwt').always, jsonParser, checkRight('product_uoa'), products.UOAadd);

router.route(`${baseURL}/products/:id/move/:uoaid`)
    .get(authenticate('jwt').always, products.productUOAmove);

//----------------------------------------------------------------------------------------------------------------------
//    ORGANIZATIONS
//----------------------------------------------------------------------------------------------------------------------
var users = require('./controllers/users');
var organizations = require('./controllers/organizations');

router.route(`${baseURL}/organizations`)
    .get(authenticate('jwt').always, organizations.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('organization_new'), organizations.insertOne);

router.route(`${baseURL}/organizations/:id`)
    .get(authenticate('jwt').always, organizations.selectOne)
    .put(authenticate('jwt').always, jsonParser, organizations.editOne);

router.route(`${baseURL}/organizations/:id/products`)
    .get(authenticate('jwt').always, organizations.selectProducts);

router.route(`${baseURL}/organizations/:id/users_csv`)
    .post(authenticate('jwt').always, jsonParser, organizations.csvUsers);

router.route(`${baseURL}/users/self/organization`)
    .get(authenticate('jwt').always, users.selfOrganization)
    .put(authenticate('jwt').always, jsonParser, users.selfOrganizationUpdate);

router.route(`${baseURL}/users/self/organization/invite`)
    .post(authenticate('jwt').always, jsonParser, users.selfOrganizationInvite);

//----------------------------------------------------------------------------------------------------------------------
// USERS
//----------------------------------------------------------------------------------------------------------------------

router.route(`${baseURL}/users`)
    .get(authenticate('jwt').always, users.select)
    .post(authenticate('jwt').ifPossible, jsonParser, users.insertOne);

router.route(`${baseURL}/users/checkToken/:token`)
    .get(users.checkToken);

router.route(`${baseURL}/users/forgot`)
    .post(jsonParser, users.forgot);

router.route(`${baseURL}/users/reset-password`)
    .put(jsonParser, users.resetPassword);

router.route(`${baseURL}/users/activate/:token`)
    .get(users.checkActivationToken)
    .post(jsonParser, users.activate);

router.route(`${baseURL}/users/check_restore_token/:token`)
    .get(users.checkRestoreToken);

router.route(`${baseURL}/users/logout`)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('users_logout_self'),*/ users.logout);

router.route(`${baseURL}/users/invite`)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_invite'), users.invite);

router.route(`${baseURL}/users/logout/:id`)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_logout'), users.logout);

router.route(`${baseURL}/users/self`)
    .get(authenticate('jwt').always, /*checkRight('users_view_self'), */ users.selectSelf)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('users_edit_self'), */ users.updateSelf);

router.route(`${baseURL}/users/:id`)
    .get(authenticate('jwt').always, checkRight('users_view_one'), users.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('users_edit_one'), users.updateOne)
    .delete(authenticate('jwt').always, checkRight('users_delete_one'), users.deleteOne);

router.route(`${baseURL}/users/:id/uoa`)
    .get(authenticate('jwt').always, checkRight('users_uoa'), users.UOAselect)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_uoa'), users.UOAaddMultiple)
    .delete(authenticate('jwt').always, checkRight('users_uoa'), users.UOAdeleteMultiple);

router.route(`${baseURL}/users/:id/uoa/:uoaid`)
    .delete(authenticate('jwt').always, checkRight('users_uoa'), users.UOAdelete)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_uoa'), users.UOAadd);

//----------------------------------------------------------------------------------------------------------------------
//    GROUPS
//----------------------------------------------------------------------------------------------------------------------

var groups = require('./controllers/groups');

router.route(`${baseURL}/organizations/:organizationId/groups`)
    .get(authenticate('jwt').always, groups.selectByOrg)
    .post(authenticate('jwt').always, jsonParser, groups.insertOne);

router.route(`${baseURL}/groups/:id`)
    .get(authenticate('jwt').always, groups.selectOne)
    .put(authenticate('jwt').always, jsonParser, groups.updateOne)
    .delete(authenticate('jwt').always, checkRight('groups_delete'), groups.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    COUNTRIES
//----------------------------------------------------------------------------------------------------------------------
var countries = require('./controllers/countries');

router.route(`${baseURL}/countries`)
    .get(authenticate('jwt').always, countries.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('countries_insert_one'), countries.insertOne);

router.route(`${baseURL}/countries/:id`)
    .put(authenticate('jwt').always, jsonParser, checkRight('countries_update_one'), countries.updateOne)
    .delete(authenticate('jwt').always, checkRight('countries_delete_one'), countries.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    WORKFLOWS
//----------------------------------------------------------------------------------------------------------------------
var workflows = require('./controllers/workflows');

router.route(`${baseURL}/workflows`)
    .get(authenticate('jwt').always, workflows.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('countries_insert_one'),*/ workflows.insertOne);

router.route(`${baseURL}/workflows/:id`)
    .get(authenticate('jwt').always, /*checkRight('countries_update_one'),*/ workflows.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('countries_update_one'),*/ workflows.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('countries_delete_one'),*/ workflows.deleteOne);

router.route(`${baseURL}/workflows/:stepId/steps`)
    .get(authenticate('jwt').always, workflows.steps)
    .delete(authenticate('jwt').always, workflows.stepsDelete)
    .put(authenticate('jwt').always, jsonParser, workflows.stepsUpdate);

//----------------------------------------------------------------------------------------------------------------------
//    DISCUSSIONS
//----------------------------------------------------------------------------------------------------------------------
var discussions = require('./controllers/discussions');

router.route(`${baseURL}/discussions`)
    .get(authenticate('jwt').always, discussions.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.insertOne);

router.route(`${baseURL}/discussions/getByTaskId/:id`)
    .get(authenticate('jwt').always, discussions.getByTaskID);

router.route(`${baseURL}/discussions/users/:taskId`)
    .get(authenticate('jwt').always, discussions.getUsers);

router.route(`${baseURL}/discussions/entryscope`)
    .get(authenticate('jwt').always, discussions.getEntryScope);

router.route(`${baseURL}/discussions/entryscope/:id`)
    .get(authenticate('jwt').always, discussions.getEntryUpdate);

router.route(`${baseURL}/discussions/:id`)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ discussions.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    NOTIFICATIONS
//----------------------------------------------------------------------------------------------------------------------
var notifications = require('./controllers/notifications');

router.route(`${baseURL}/notifications`)
    .get(authenticate('jwt').always, notifications.select)
    .post(authenticate('jwt').always, jsonParser, notifications.insertOne);

router.route(`${baseURL}/notifications/reply/:notificationId`)
    .post(authenticate('jwt').always, jsonParser, notifications.reply, notifications.insertOne);

router.route(`${baseURL}/notifications/users`)
    .get(authenticate('jwt').always, notifications.users);

router.route(`${baseURL}/notifications/resend/:notificationId`)
    .put(authenticate('jwt').always, jsonParser, notifications.resend);

router.route(`${baseURL}/notifications/resenduserinvite/:userId`)
    .put(authenticate('jwt').always, jsonParser, notifications.resendUserInvite);

router.route(`${baseURL}/notifications/markread/:notificationId`)
    .put(authenticate('jwt').always, jsonParser, notifications.changeRead(true), notifications.markReadUnread);

router.route(`${baseURL}/notifications/markunread/:notificationId`)
    .put(authenticate('jwt').always, jsonParser, notifications.changeRead(false), notifications.markReadUnread);

router.route(`${baseURL}/notifications/markallread`)
    .put(authenticate('jwt').always, jsonParser, notifications.markAllRead);

router.route(`${baseURL}/notifications/delete`)
    .delete(authenticate('jwt').always, notifications.deleteList);

//----------------------------------------------------------------------------------------------------------------------
//    Units of Analysis
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysis = require('./controllers/uoas');

router.route(`${baseURL}/uoas`)
    .get(authenticate('jwt').always, checkRight('rights_view_all'), UnitOfAnalysis.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysis_insert_one'), UnitOfAnalysis.insert);

router.route(`${baseURL}/uoas/:id`)
    .get(authenticate('jwt').always, UnitOfAnalysis.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysis_update_one'), UnitOfAnalysis.updateOne)
    .delete(authenticate('jwt').always, jsonParser, checkRight('unitofanalysis_delete_one'), UnitOfAnalysis.deleteOne);

router.route(`${baseURL}/import_uoas_csv`)
    .post(authenticate('jwt').ifPossible, jsonParser, UnitOfAnalysis.csvImport);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisType = require('./controllers/uoatypes');

router.route(`${baseURL}/uoatypes`)
    .get(authenticate('jwt').always, UnitOfAnalysisType.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistype_insert_one'), UnitOfAnalysisType.insertOne);

router.route(`${baseURL}/uoatypes/:id`)
    .get(authenticate('jwt').always, UnitOfAnalysisType.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistype_update_one'), UnitOfAnalysisType.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysistype_delete_one'), UnitOfAnalysisType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Classification Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisClassType = require('./controllers/uoaclasstypes');

router.route(`${baseURL}/uoaclasstypes`)
    .get(authenticate('jwt').always, UnitOfAnalysisClassType.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysisclasstype_insert_one'), UnitOfAnalysisClassType.insertOne);

router.route(`${baseURL}/uoaclasstypes/:id`)
    .get(authenticate('jwt').always, UnitOfAnalysisClassType.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysisclasstype_update_one'), UnitOfAnalysisClassType.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysisclasstype_delete_one'), UnitOfAnalysisClassType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Tags
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTag = require('./controllers/uoatags');

router.route(`${baseURL}/uoatags`)
    .get(authenticate('jwt').always, UnitOfAnalysisTag.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistag_insert_one'), UnitOfAnalysisTag.insertOne);

router.route(`${baseURL}/uoatags/:id`)
    .get(authenticate('jwt').always, UnitOfAnalysisTag.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistag_update_one'), UnitOfAnalysisTag.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysistag_delete_one'), UnitOfAnalysisTag.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis to Tags Link
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTagLink = require('./controllers/uoataglinks');

router.route(`${baseURL}/uoataglinks`)
    .get(authenticate('jwt').always, UnitOfAnalysisTagLink.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('uoataglink_insert_one'), UnitOfAnalysisTagLink.checkInsert, UnitOfAnalysisTagLink.insertOne);

router.route(`${baseURL}/uoataglinks/:id`)
    .delete(authenticate('jwt').always, checkRight('uoataglink_delete_one'), UnitOfAnalysisTagLink.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Visualizations
//----------------------------------------------------------------------------------------------------------------------
var Visualization = require('./controllers/visualizations');
var ComparativeVisualization = require('./controllers/comparative_visualizations');

router.route(`${baseURL}/organizations/:organizationId/visualizations`)
    .get(authenticate('jwt').always, Visualization.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ Visualization.insertOne);

router.route(`${baseURL}/organizations/:organizationId/visualizations/:id`)
    .get(authenticate('jwt').always, Visualization.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ Visualization.updateOne)
    .delete(authenticate('jwt').always, /*checkRight(), */ Visualization.deleteOne);

router.route(`${baseURL}/organizations/:organizationId/comparative_visualizations`)
    .get( /*authenticate('token').always,*/ ComparativeVisualization.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertOne);

router.route(`${baseURL}/organizations/:organizationId/comparative_visualizations/:id`)
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateOne)
    .delete(authenticate('jwt').always, /*checkRight(), */ ComparativeVisualization.deleteOne);

router.route(`${baseURL}/organizations/:organizationId/comparative_visualizations/:id/datasets`)
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectDatasets)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertDataset);

router.route(`${baseURL}/organizations/:organizationId/comparative_visualizations/:id/datasets/parse`)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.parseDataset);

router.route(`${baseURL}/organizations/:organizationId/comparative_visualizations/:id/:datasets/:datasetId`)
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectDataset)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateDataset)
    .delete(authenticate('jwt').always, /*checkRight(), */ ComparativeVisualization.deleteDataset);

//----------------------------------------------------------------------------------------------------------------------
//    Data Export
//----------------------------------------------------------------------------------------------------------------------
var DataExport = require('./controllers/data_export');

router.route(`${baseURL}/data-api/datasets`)
    .get(DataExport.authenticate, DataExport.select);

router.route(`${baseURL}/data-api/datasets/:id`)
    .get(DataExport.authenticate, DataExport.selectOne);

module.exports = router;

//----------------------------------------------------------------------------------------------------------------------
//    LOGS
//----------------------------------------------------------------------------------------------------------------------
var logs = require('./controllers/logs');

router.route(`${baseURL}/logs`)
    .get(authenticate('jwt').always, logs.select);

//----------------------------------------------------------------------------------------------------------------------
//    System Messages
//----------------------------------------------------------------------------------------------------------------------
var SystemMessages = require('./controllers/system_messages');
router.route(`${baseURL}/system_messages`)
    .post(authenticate('jwt').always, jsonParser, SystemMessages.send);


//----------------------------------------------------------------------------------------------------------------------
//    AWS
//----------------------------------------------------------------------------------------------------------------------
var aws = require('./controllers/aws');
router.route(`${baseURL}/sign-s3`)
    .get(authenticate('jwt').always, jsonParser, aws.signS3);
