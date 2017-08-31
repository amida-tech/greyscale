var express = require('express'),
    passport = require("passport"),
    authenticate = require('./auth').authenticate,
    authorize = require('./auth').authorize,
    checkRight = require('./auth').checkRight,
    checkPermission = require('./auth').checkPermission,
    config = require('../config'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json({
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        limit: config.max_upload_filesize
    });

//----------------------------------------------------------------------------------------------------------------------
//    ROLES
//----------------------------------------------------------------------------------------------------------------------
var roles = require('./controllers/roles');

router.route('/:realm/v0.2/roles')
    .get(authenticate('jwt').ifPossible, roles.select)
    .post(authenticate('jwt').ifPossible, jsonParser, roles.insertOne);

router.route('/:realm/v0.2/roles/:id')
    .get(authenticate('jwt').ifPossible, roles.selectOne)
    .put(authenticate('jwt').ifPossible, jsonParser, roles.updateOne)
    .delete(authenticate('jwt').ifPossible, roles.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var rights = require('./controllers/rights');

router.route('/:realm/v0.2/rights')
    .get(authenticate('jwt').always, checkRight('rights_view_all'), rights.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('rights_add_one'), rights.insertOne);

router.route('/:realm/v0.2/rights/:id')
    .get(authenticate('jwt').always, checkRight('rights_view_one'), rights.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('rights_edit_one'), rights.updateOne)
    .delete(authenticate('jwt').always, checkRight('rights_delete_one'), rights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ROLE RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var roleRights = require('./controllers/role_rights');

router.route('/:realm/v0.2/roles/:roleID/rights')
    .get(authenticate('jwt').always, checkRight('role_rights_view_one'), roleRights.select);

router.route('/:realm/v0.2/roles/:roleID/rights/:rightID')
    .post(authenticate('jwt').always, jsonParser, checkRight('role_rights_add'), roleRights.insertOne)
    .delete(authenticate('jwt').always, checkRight('role_rights_delete'), roleRights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCES
//----------------------------------------------------------------------------------------------------------------------
var essences = require('./controllers/essences');

router.route('/:realm/v0.2/essences')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essences.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essences.insertOne);
router.route('/:realm/v0.2/essences/:id')
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essences.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    PROJECTS
//----------------------------------------------------------------------------------------------------------------------
var projects = require('./controllers/projects');

router.route('/:realm/v0.2/projects')
    .get(authenticate('jwt').always, projects.listAll)
    .post(authenticate('jwt').always, jsonParser, projects.insertOne);

router.route('/:realm/v0.2/projects/:id')
    .get(authenticate('jwt').always, projects.selectOne)
    .delete(authenticate('jwt').always, projects.delete)
    .put(authenticate('jwt').always, jsonParser, projects.editOne);

router.route('/:realm/v0.2/projects/:id/products')
    .get(authenticate('jwt').always, projects.productList);

router.route('/:realm/v0.2/projects/:id/surveys')
    .get(authenticate('jwt').always, projects.surveyList);

//----------------------------------------------------------------------------------------------------------------------
//    SURVEYS
//----------------------------------------------------------------------------------------------------------------------
var surveys = require('./controllers/surveys');

router.route('/:realm/v0.2/surveys')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.insertOne);

router.route('/:realm/v0.2/surveys/:id')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.editOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.delete);

router.route('/:realm/v0.2/surveys/:id/questions')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.questions)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionAdd);

router.route('/:realm/v0.2/questions/:id')
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionEdit)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveys.questionDelete);

//----------------------------------------------------------------------------------------------------------------------
//    SURVEY ANSWERS
//----------------------------------------------------------------------------------------------------------------------
var surveyAnswers = require('./controllers/survey_answers');

router.route('/:realm/v0.2/survey_answers')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.add);

router.route('/:realm/v0.2/survey_answers/:productId/:UOAid')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.getByProdUoa);

router.route('/:realm/v0.2/survey_answers/:id')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.selectOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ surveyAnswers.delete)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.update);

//----------------------------------------------------------------------------------------------------------------------
//    ATTACHMENTS (universal mechanism)
//----------------------------------------------------------------------------------------------------------------------

var attachments = require('./controllers/attachments');

router.route('/:realm/v0.2/uploads/links/:essenceId/:entityId')
    .put(authenticate('jwt').always, jsonParser, attachments.links);

router.route('/:realm/v0.2/uploads/:id/ticket')
    .get(authenticate('jwt').always, attachments.getTicket);

router.route('/:realm/v0.2/uploads/:id/:essenceId/:entityId')
    .delete(authenticate('jwt').always, attachments.delete);

router.route('/:realm/v0.2/uploads/upload_link')
    .post(authenticate('jwt').always, jsonParser, attachments.getUploadLink);

router.route('/:realm/v0.2/uploads/success')
    .post(authenticate('jwt').always, jsonParser, attachments.uploadSuccess);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCE_ROLES
//----------------------------------------------------------------------------------------------------------------------
var essenceRoles = require('./controllers/essence_roles');

router.route('/:realm/v0.2/essence_roles')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.insertOne);

router.route('/:realm/v0.2/essence_roles/:id')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ essenceRoles.delete);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_MATRICES
//-----------------------------------------------s-----------------------------------------------------------------------
var accessMatrices = require('./controllers/access_matrices');

router.route('/:realm/v0.2/access_matrices')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.insertOne);

router.route('/:realm/v0.2/access_matrices/:id/permissions')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsSelect);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_PERMISSIONS
//----------------------------------------------------------------------------------------------------------------------
router.route('/:realm/v0.2/access_permissions')
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsInsertOne);

router.route('/:realm/v0.2/access_permissions/:id')
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsDeleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    LANGUAGES
//----------------------------------------------------------------------------------------------------------------------
var languages = require('./controllers/languages');

router.route('/:realm/v0.2/languages')
    .get( /*authenticate('token').always, */ languages.select)
    .post(authenticate('jwt').always, jsonParser, languages.insertOne);

router.route('/:realm/v0.2/languages/:id')
    .get(authenticate('jwt').always, languages.selectOne)
    .put(authenticate('jwt').always, jsonParser, languages.editOne)
    .delete(authenticate('jwt').always, languages.delete);

//----------------------------------------------------------------------------------------------------------------------
//    TASKS
//----------------------------------------------------------------------------------------------------------------------
var tasks = require('./controllers/tasks');

router.route('/:realm/v0.2/tasks')
    .get(authenticate('jwt').always, tasks.select)
    .post(authenticate('jwt').always, jsonParser, tasks.insertOne);

router.route('/:realm/v0.2/tasks/:id')
    .get(authenticate('jwt').always, tasks.selectOne)
    .put(authenticate('jwt').always, jsonParser, tasks.updateOne)
    .delete(authenticate('jwt').always, tasks.delete);

router.route('/:realm/v0.2/tasks-by-proj-id/:id')
    .get(authenticate('jwt').always, checkRight('rights_view_all'), tasks.getTasksByProjectId);

router.route('/:realm/v0.2/tasks-by-user-id/:id')
    .get(authenticate('jwt').always, tasks.getTasksByUserId);

router.route('/:realm/v0.2/tasks-self')
    .get(authenticate('jwt').always, tasks.getSelfTasks);

//----------------------------------------------------------------------------------------------------------------------
//    TRANSLATIONS
//----------------------------------------------------------------------------------------------------------------------
var translations = require('./controllers/translations');
router.route('/:realm/v0.2/translations')
    .get(authenticate('jwt').always, translations.select)
    .post(authenticate('jwt').always, jsonParser, translations.insertOne);

router.route('/:realm/v0.2/translations/:essenceId/:entityId/:field/:langId')
    .delete(authenticate('jwt').always, /*checkPermission('product_delete','products'),*/ translations.delete)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_delete','products'),*/ translations.editOne);

router.route('/:realm/v0.2/translations/:essenceId')
    .get(authenticate('jwt').always, translations.selectByParams);

router.route('/:realm/v0.2/translations/:essenceId/:entityId')
    .get(authenticate('jwt').always, translations.selectByParams);
//----------------------------------------------------------------------------------------------------------------------
//    PRODUCTS
//----------------------------------------------------------------------------------------------------------------------
var products = require('./controllers/products');
router.route('/:realm/v0.2/products')
    .get(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ products.select)
    .post(authenticate('jwt').always, jsonParser, products.insertOne);

router.route('/:realm/v0.2/products/:id')
    .get(authenticate('jwt').always, /*checkPermission('product_select', 'products'),*/ products.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.updateOne)
    .delete(authenticate('jwt').always, /*checkPermission('product_delete', 'products'),*/ products.delete);

router.route('/:realm/v0.2/products/:id/tasks')
    .get(authenticate('jwt').always, /*checkPermission('product_select', 'products'),*/ products.tasks)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_select', 'products'),*/ products.editTasks);

router.route('/:realm/v0.2/products/:id/aggregate')
    .get( /*authenticate('token').always,*/ products.aggregateIndexes);

router.route('/:realm/v0.2/products/:id/aggregate.csv')
    .get( /*authenticate('jwt').always,*/ products.aggregateIndexesCsv);

router.route('/:realm/v0.2/products/:id/indexes')
    .get( /*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.indexes)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editIndexes);

router.route('/:realm/v0.2/products/:id/subindexes')
    .get( /*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.subindexes)
    .put(authenticate('jwt').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editSubindexes);

router.route('/:realm/v0.2/products/:ticket/export.csv')
    .get( /*authenticate('token').always,*/ products.export);

router.route('/:realm/v0.2/products/:id/export_ticket')
    .get( /*authenticate('jwt').always,*/ products.getTicket);

router.route('/:realm/v0.2/products/:id/uoa')
    .get(authenticate('jwt').always, checkRight('product_uoa'), products.UOAselect)
    .post(authenticate('jwt').always, jsonParser, checkRight('product_uoa'), products.UOAaddMultiple);

router.route('/:realm/v0.2/products/:id/uoa/:uoaid')
    .delete(authenticate('jwt').always, checkRight('product_uoa'), products.UOAdelete)
    .post(authenticate('jwt').always, jsonParser, checkRight('product_uoa'), products.UOAadd);

router.route('/:realm/v0.2/products/:id/move/:uoaid')
    .get(authenticate('jwt').always, products.productUOAmove);

//----------------------------------------------------------------------------------------------------------------------
//    ORGANIZATIONS
//----------------------------------------------------------------------------------------------------------------------
var users = require('./controllers/users');
var organizations = require('./controllers/organizations');

router.route('/:realm/v0.2/organizations')
    .get(authenticate('jwt').always, organizations.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('organization_new'), organizations.insertOne);

router.route('/:realm/v0.2/organizations/:id')
    .get(authenticate('jwt').always, organizations.selectOne)
    .put(authenticate('jwt').always, jsonParser, organizations.editOne);

router.route('/:realm/v0.2/organizations/:id/products')
    .get(authenticate('jwt').always, organizations.selectProducts);

router.route('/:realm/v0.2/organizations/:id/users_csv')
    .post(authenticate('jwt').always, jsonParser, organizations.csvUsers);

router.route('/:realm/v0.2/users/self/organization')
    .get(authenticate('jwt').always, users.selfOrganization)
    .put(authenticate('jwt').always, jsonParser, users.selfOrganizationUpdate);

router.route('/:realm/v0.2/users/self/organization/invite')
    .post(authenticate('jwt').always, jsonParser, users.selfOrganizationInvite);

//----------------------------------------------------------------------------------------------------------------------
// USERS
//----------------------------------------------------------------------------------------------------------------------

router.route('/:realm/v0.2/users')
    .get(authenticate('jwt').always, users.select)
    .post(authenticate('jwt').ifPossible, jsonParser, users.insertOne);

router.route('/:realm/v0.2/users/token')
    .get(authenticate('basic').always, /*checkRight('users_token'),*/ users.token);

router.route('/:realm/v0.2/users/checkToken/:token')
    .get(users.checkToken);

router.route('/:realm/v0.2/users/forgot')
    .post(jsonParser, users.forgot);

router.route('/:realm/v0.2/users/reset-password')
    .put(jsonParser, users.resetPassword);

router.route('/:realm/v0.2/users/activate/:token')
    .get(users.checkActivationToken)
    .post(jsonParser, users.activate);

router.route('/:realm/v0.2/users/check_restore_token/:token')
    .get(users.checkRestoreToken);

router.route('/:realm/v0.2/users/logout')
    .post(authenticate('jwt').always, jsonParser, /*checkRight('users_logout_self'),*/ users.logout);

router.route('/:realm/v0.2/users/invite')
    .post(authenticate('jwt').always, jsonParser, checkRight('users_invite'), users.invite);

router.route('/:realm/v0.2/users/logout/:id')
    .post(authenticate('jwt').always, jsonParser, checkRight('users_logout'), users.logout);

router.route('/:realm/v0.2/users/self')
    .get(authenticate('jwt').always, /*checkRight('users_view_self'), */ users.selectSelf)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('users_edit_self'), */ users.updateSelf);

router.route('/:realm/v0.2/users/:id')
    .get(authenticate('jwt').always, checkRight('users_view_one'), users.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('users_edit_one'), users.updateOne)
    .delete(authenticate('jwt').always, checkRight('users_delete_one'), users.deleteOne);

router.route('/:realm/v0.2/users/:id/uoa')
    .get(authenticate('jwt').always, checkRight('users_uoa'), users.UOAselect)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_uoa'), users.UOAaddMultiple)
    .delete(authenticate('jwt').always, checkRight('users_uoa'), users.UOAdeleteMultiple);

router.route('/:realm/v0.2/users/:id/uoa/:uoaid')
    .delete(authenticate('jwt').always, checkRight('users_uoa'), users.UOAdelete)
    .post(authenticate('jwt').always, jsonParser, checkRight('users_uoa'), users.UOAadd);

//----------------------------------------------------------------------------------------------------------------------
//    GROUPS
//----------------------------------------------------------------------------------------------------------------------

var groups = require('./controllers/groups');

router.route('/:realm/v0.2/organizations/:organizationId/groups')
    .get(authenticate('jwt').always, groups.selectByOrg)
    .post(authenticate('jwt').always, jsonParser, groups.insertOne);

router.route('/:realm/v0.2/groups/:id')
    .get(authenticate('jwt').always, groups.selectOne)
    .put(authenticate('jwt').always, jsonParser, groups.updateOne)
    .delete(authenticate('jwt').always, checkRight('groups_delete'), groups.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    COUNTRIES
//----------------------------------------------------------------------------------------------------------------------
var countries = require('./controllers/countries');

router.route('/:realm/v0.2/countries')
    .get(authenticate('jwt').always, countries.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('countries_insert_one'), countries.insertOne);

router.route('/:realm/v0.2/countries/:id')
    .put(authenticate('jwt').always, jsonParser, checkRight('countries_update_one'), countries.updateOne)
    .delete(authenticate('jwt').always, checkRight('countries_delete_one'), countries.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    WORKFLOWS
//----------------------------------------------------------------------------------------------------------------------
var workflows = require('./controllers/workflows');

router.route('/:realm/v0.2/workflows')
    .get(authenticate('jwt').always, workflows.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('countries_insert_one'),*/ workflows.insertOne);

router.route('/:realm/v0.2/workflows/:id')
    .get(authenticate('jwt').always, /*checkRight('countries_update_one'),*/ workflows.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight('countries_update_one'),*/ workflows.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('countries_delete_one'),*/ workflows.deleteOne);

router.route('/:realm/v0.2/workflows/:id/steps')
    .get(authenticate('jwt').always, workflows.steps)
    .delete(authenticate('token').always, workflows.stepsDelete)
    .put(authenticate('jwt').always, jsonParser, workflows.stepsUpdate);

//router.route('/:realm/v0.2/workflow_steps')
//    .get(authenticate('token').always, workflows.stepListSelect)
//    .post(authenticate('token').always, workflows.stepListAdd);
//
//router.route('/:realm/v0.2/workflow_steps/:id')
//    .get(authenticate('token').always, workflows.stepListSelectOne)
//    .put(authenticate('token').always, workflows.stepListUpdateOne)
//    .delete(authenticate('token').always, workflows.stepListDelete);

//----------------------------------------------------------------------------------------------------------------------
//    DISCUSSIONS
//----------------------------------------------------------------------------------------------------------------------
var discussions = require('./controllers/discussions');

router.route('/:realm/v0.2/discussions')
    .get(authenticate('jwt').always, discussions.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.insertOne);
router.route('/:realm/v0.2/discussions/getByTaskId/:id')
    .get(authenticate('jwt').always, discussions.getByTaskID);
router.route('/:realm/v0.2/discussions/users/:taskId')
    .get(authenticate('jwt').always, discussions.getUsers);
router.route('/:realm/v0.2/discussions/entryscope')
    .get(authenticate('jwt').always, discussions.getEntryScope);
router.route('/:realm/v0.2/discussions/entryscope/:id')
    .get(authenticate('jwt').always, discussions.getEntryUpdate);
router.route('/:realm/v0.2/discussions/:id')
    .put(authenticate('jwt').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.updateOne)
    .delete(authenticate('jwt').always, /*checkRight('rights_view_all'),*/ discussions.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    NOTIFICATIONS
//----------------------------------------------------------------------------------------------------------------------
var notifications = require('./controllers/notifications');

router.route('/:realm/v0.2/notifications')
    .get(authenticate('jwt').always, notifications.select)
    .post(authenticate('jwt').always, jsonParser, notifications.insertOne);
router.route('/:realm/v0.2/notifications/reply/:notificationId')
    .post(authenticate('jwt').always, jsonParser, notifications.reply, notifications.insertOne);
router.route('/:realm/v0.2/notifications/users')
    .get(authenticate('jwt').always, notifications.users);
router.route('/:realm/v0.2/notifications/resend/:notificationId')
    .put(authenticate('jwt').always, jsonParser, notifications.resend);
router.route('/:realm/v0.2/notifications/resenduserinvite/:userId')
    .put(authenticate('jwt').always, jsonParser, notifications.resendUserInvite);
router.route('/:realm/v0.2/notifications/markread/:notificationId')
    .put(authenticate('jwt').always, jsonParser, notifications.changeRead(true), notifications.markReadUnread);
router.route('/:realm/v0.2/notifications/markunread/:notificationId')
    .put(authenticate('jwt').always, jsonParser, notifications.changeRead(false), notifications.markReadUnread);
router.route('/:realm/v0.2/notifications/markallread')
    .put(authenticate('jwt').always, jsonParser, notifications.markAllRead);
router.route('/:realm/v0.2/notifications/delete')
    .delete(authenticate('jwt').always, notifications.deleteList);

//----------------------------------------------------------------------------------------------------------------------
//    Units of Analysis
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysis = require('./controllers/uoas');

router.route('/:realm/v0.2/uoas')
    .get(authenticate('jwt').always, UnitOfAnalysis.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysis_insert_one'), UnitOfAnalysis.insertOne);

router.route('/:realm/v0.2/uoas/:id')
    .get(authenticate('jwt').always, UnitOfAnalysis.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysis_update_one'), UnitOfAnalysis.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysis_delete_one'), UnitOfAnalysis.deleteOne);

router.route('/:realm/v0.2/import_uoas_csv')
    .post(authenticate('jwt').ifPossible, jsonParser, UnitOfAnalysis.csvImport);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisType = require('./controllers/uoatypes');

router.route('/:realm/v0.2/uoatypes')
    .get(authenticate('jwt').always, UnitOfAnalysisType.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistype_insert_one'), UnitOfAnalysisType.insertOne);

router.route('/:realm/v0.2/uoatypes/:id')
    .get(authenticate('jwt').always, UnitOfAnalysisType.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistype_update_one'), UnitOfAnalysisType.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysistype_delete_one'), UnitOfAnalysisType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Classification Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisClassType = require('./controllers/uoaclasstypes');

router.route('/:realm/v0.2/uoaclasstypes')
    .get(authenticate('jwt').always, UnitOfAnalysisClassType.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysisclasstype_insert_one'), UnitOfAnalysisClassType.insertOne);

router.route('/:realm/v0.2/uoaclasstypes/:id')
    .get(authenticate('jwt').always, UnitOfAnalysisClassType.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysisclasstype_update_one'), UnitOfAnalysisClassType.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysisclasstype_delete_one'), UnitOfAnalysisClassType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Tags
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTag = require('./controllers/uoatags');

router.route('/:realm/v0.2/uoatags')
    .get(authenticate('jwt').always, UnitOfAnalysisTag.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistag_insert_one'), UnitOfAnalysisTag.insertOne);

router.route('/:realm/v0.2/uoatags/:id')
    .get(authenticate('jwt').always, UnitOfAnalysisTag.selectOne)
    .put(authenticate('jwt').always, jsonParser, checkRight('unitofanalysistag_update_one'), UnitOfAnalysisTag.updateOne)
    .delete(authenticate('jwt').always, checkRight('unitofanalysistag_delete_one'), UnitOfAnalysisTag.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis to Tags Link
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTagLink = require('./controllers/uoataglinks');

router.route('/:realm/v0.2/uoataglinks')
    .get(authenticate('jwt').always, UnitOfAnalysisTagLink.select)
    .post(authenticate('jwt').always, jsonParser, checkRight('uoataglink_insert_one'), UnitOfAnalysisTagLink.checkInsert, UnitOfAnalysisTagLink.insertOne);

router.route('/:realm/v0.2/uoataglinks/:id')
    .delete(authenticate('jwt').always, checkRight('uoataglink_delete_one'), UnitOfAnalysisTagLink.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Visualizations
//----------------------------------------------------------------------------------------------------------------------
var Visualization = require('./controllers/visualizations');
var ComparativeVisualization = require('./controllers/comparative_visualizations');

router.route('/:realm/v0.2/organizations/:organizationId/visualizations')
    .get(authenticate('jwt').always, Visualization.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ Visualization.insertOne);

router.route('/:realm/v0.2/organizations/:organizationId/visualizations/:id')
    .get(authenticate('jwt').always, Visualization.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ Visualization.updateOne)
    .delete(authenticate('jwt').always, /*checkRight(), */ Visualization.deleteOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations')
    .get( /*authenticate('token').always,*/ ComparativeVisualization.select)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id')
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectOne)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateOne)
    .delete(authenticate('jwt').always, /*checkRight(), */ ComparativeVisualization.deleteOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/datasets')
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectDatasets)
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertDataset);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/datasets/parse')
    .post(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.parseDataset);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/:datasets/:datasetId')
    .get( /*authenticate('token').always,*/ ComparativeVisualization.selectDataset)
    .put(authenticate('jwt').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateDataset)
    .delete(authenticate('jwt').always, /*checkRight(), */ ComparativeVisualization.deleteDataset);

//----------------------------------------------------------------------------------------------------------------------
//    Data Export
//----------------------------------------------------------------------------------------------------------------------
var DataExport = require('./controllers/data_export');

router.route('/:realm/v0.2/data-api/datasets')
    .get(DataExport.authenticate, DataExport.select);

router.route('/:realm/v0.2/data-api/datasets/:id')
    .get(DataExport.authenticate, DataExport.selectOne);

module.exports = router;

//----------------------------------------------------------------------------------------------------------------------
//    LOGS
//----------------------------------------------------------------------------------------------------------------------
var logs = require('./controllers/logs');

router.route('/:realm/v0.2/logs')
    .get(authenticate('jwt').always, logs.select);
