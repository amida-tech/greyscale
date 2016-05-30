var express = require('express'),
    authenticate = require('app/auth').authenticate,
    authorize = require('app/auth').authorize,
    checkRight = require('app/auth').checkRight,
    checkPermission = require('app/auth').checkPermission,
    config = require('config'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json({limit: config.max_upload_filesize});

//----------------------------------------------------------------------------------------------------------------------
//    ROLES
//----------------------------------------------------------------------------------------------------------------------
var roles = require('app/controllers/roles');

router.route('/:realm/v0.2/roles')
    .get(authenticate('token').ifPossible, roles.select)
    .post(authenticate('token').ifPossible, jsonParser, roles.insertOne);

router.route('/:realm/v0.2/roles/:id')
    .get(authenticate('token').ifPossible, roles.selectOne)
    .put(authenticate('token').ifPossible, jsonParser, roles.updateOne)
    .delete(authenticate('token').ifPossible, roles.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var rights = require('app/controllers/rights');

router.route('/:realm/v0.2/rights')
    .get(authenticate('token').always, checkRight('rights_view_all'), rights.select)
    .post(authenticate('token').always, jsonParser, checkRight('rights_add_one'), rights.insertOne);

router.route('/:realm/v0.2/rights/:id')
    .get(authenticate('token').always, checkRight('rights_view_one'), rights.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('rights_edit_one'), rights.updateOne)
    .delete(authenticate('token').always, checkRight('rights_delete_one'), rights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ROLE RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var roleRights = require('app/controllers/role_rights');

router.route('/:realm/v0.2/roles/:roleID/rights')
    .get(authenticate('token').always, checkRight('role_rights_view_one'), roleRights.select);

router.route('/:realm/v0.2/roles/:roleID/rights/:rightID')
    .post(authenticate('token').always, jsonParser, checkRight('role_rights_add'), roleRights.insertOne)
    .delete(authenticate('token').always, checkRight('role_rights_delete'), roleRights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCES
//----------------------------------------------------------------------------------------------------------------------
var essences = require('app/controllers/essences');

router.route('/:realm/v0.2/essences')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essences.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ essences.insertOne);
router.route('/:realm/v0.2/essences/:id')
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ essences.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    PROJECTS
//----------------------------------------------------------------------------------------------------------------------
var projects = require('app/controllers/projects');

router.route('/:realm/v0.2/projects')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ projects.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ projects.insertOne);

router.route('/:realm/v0.2/projects/:id')
    .get(authenticate('token').always, projects.selectOne)
    .delete(authenticate('token').always, projects.delete)
    .put(authenticate('token').always, jsonParser, projects.editOne);

router.route('/:realm/v0.2/projects/:id/products')
    .get(authenticate('token').always, projects.productList);

router.route('/:realm/v0.2/projects/:id/surveys')
    .get(authenticate('token').always, projects.surveyList);

//----------------------------------------------------------------------------------------------------------------------
//    AMAZON WEB SERVICES
//----------------------------------------------------------------------------------------------------------------------
var aws = require('app/controllers/aws');

router.route('/:realm/v0.2/aws/upload_link')
    //.get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ aws.getUploadLink);


//----------------------------------------------------------------------------------------------------------------------
//    SURVEYS
//----------------------------------------------------------------------------------------------------------------------
var surveys = require('app/controllers/surveys');

router.route('/:realm/v0.2/surveys')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.insertOne);

router.route('/:realm/v0.2/surveys/:id')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.selectOne)
    .put(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.editOne)
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.delete);

router.route('/:realm/v0.2/surveys/:id/questions')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.questions)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionAdd);

router.route('/:realm/v0.2/questions/:id')
    .put(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveys.questionEdit)
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveys.questionDelete);

//----------------------------------------------------------------------------------------------------------------------
//    SURVEY ANSWERS
//----------------------------------------------------------------------------------------------------------------------
var surveyAnswers = require('app/controllers/survey_answers');

router.route('/:realm/v0.2/survey_answers')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveyAnswers.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.add);

router.route('/:realm/v0.2/survey_answers/:productId/:UOAid')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveyAnswers.getByProdUoa)

router.route('/:realm/v0.2/survey_answers/:id')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveyAnswers.selectOne)
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ surveyAnswers.delete)
    .put(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ surveyAnswers.update);

router.route('/:realm/v0.2/attachments')
    .post(authenticate('token').always, surveyAnswers.attach);

router.route('/:realm/v0.2/attachments/get/:ticket')
    .get(surveyAnswers.getAttachment);

router.route('/:realm/v0.2/attachments/:id/ticket')
    .get(authenticate('token').always, surveyAnswers.getTicket);

router.route('/:realm/v0.2/attachments/:id/link/:answerId')
    .get(authenticate('token').always, surveyAnswers.linkAttach);

router.route('/:realm/v0.2/attachments/:id')
    .delete(authenticate('token').always, surveyAnswers.delAttachment);

//----------------------------------------------------------------------------------------------------------------------
//    ESSENCE_ROLES
//----------------------------------------------------------------------------------------------------------------------
var essenceRoles = require('app/controllers/essence_roles');

router.route('/:realm/v0.2/essence_roles')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essenceRoles.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.insertOne);

router.route('/:realm/v0.2/essence_roles/:id')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essenceRoles.selectOne)
    .put(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ essenceRoles.updateOne)
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ essenceRoles.delete);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_MATRICES
//----------------------------------------------------------------------------------------------------------------------
var accessMatrices = require('app/controllers/access_matrices');

router.route('/:realm/v0.2/access_matrices')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ accessMatrices.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.insertOne);

router.route('/:realm/v0.2/access_matrices/:id/permissions')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsSelect);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_PERMISSIONS
//----------------------------------------------------------------------------------------------------------------------
router.route('/:realm/v0.2/access_permissions')
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsInsertOne);

router.route('/:realm/v0.2/access_permissions/:id')
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ accessMatrices.permissionsDeleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    LANGUAGES
//----------------------------------------------------------------------------------------------------------------------
var languages = require('app/controllers/languages');

router.route('/:realm/v0.2/languages')
    .get(/*authenticate('token').always, */languages.select)
    .post(authenticate('token').always, jsonParser, languages.insertOne);

router.route('/:realm/v0.2/languages/:id')
    .get(authenticate('token').always, languages.selectOne)
    .put(authenticate('token').always, jsonParser, languages.editOne)
    .delete(authenticate('token').always, languages.delete);

//----------------------------------------------------------------------------------------------------------------------
//    TASKS
//----------------------------------------------------------------------------------------------------------------------
var tasks = require('app/controllers/tasks');

router.route('/:realm/v0.2/tasks')
    .get(authenticate('token').always, tasks.select)
    .post(authenticate('token').always, jsonParser, tasks.insertOne);

router.route('/:realm/v0.2/tasks/:id')
    .get(authenticate('token').always, tasks.selectOne)
    .put(authenticate('token').always, jsonParser, tasks.updateOne)
    .delete(authenticate('token').always, tasks.delete);

//----------------------------------------------------------------------------------------------------------------------
//    TRANSLATIONS
//----------------------------------------------------------------------------------------------------------------------
var translations = require('app/controllers/translations');
router.route('/:realm/v0.2/translations')
    .get(authenticate('token').always, translations.select)
    .post(authenticate('token').always, jsonParser, translations.insertOne);

router.route('/:realm/v0.2/translations/:essenceId/:entityId/:field/:langId')
    .delete(authenticate('token').always, /*checkPermission('product_delete','products'),*/ translations.delete)
    .put(authenticate('token').always, jsonParser, /*checkPermission('product_delete','products'),*/ translations.editOne);

router.route('/:realm/v0.2/translations/:essenceId')
    .get(authenticate('token').always, translations.selectByParams);

router.route('/:realm/v0.2/translations/:essenceId/:entityId')
    .get(authenticate('token').always, translations.selectByParams);
//----------------------------------------------------------------------------------------------------------------------
//    PRODUCTS
//----------------------------------------------------------------------------------------------------------------------
var products = require('app/controllers/products');
router.route('/:realm/v0.2/products')
    .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ products.select)
    .post(authenticate('token').always, jsonParser, products.insertOne);

router.route('/:realm/v0.2/products/:id')
    .get(authenticate('token').always, checkPermission('product_select', 'products'), products.selectOne)
    .put(authenticate('token').always, jsonParser, checkPermission('product_update', 'products'), products.updateOne)
    .delete(authenticate('token').always, checkPermission('product_delete', 'products'), products.delete);

router.route('/:realm/v0.2/products/:id/tasks')
    .get(authenticate('token').always, /*checkPermission('product_select', 'products'),*/ products.tasks)
    .put(authenticate('token').always, jsonParser, /*checkPermission('product_select', 'products'),*/ products.editTasks);

router.route('/:realm/v0.2/products/:id/aggregate')
    .get(/*authenticate('token').always,*/ products.aggregateIndexes);

router.route('/:realm/v0.2/products/:id/aggregate.csv')
    .get(/*authenticate('token').always,*/ products.aggregateIndexesCsv);

router.route('/:realm/v0.2/products/:id/indexes')
    .get(/*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.indexes)
    .put(authenticate('token').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editIndexes);

router.route('/:realm/v0.2/products/:id/subindexes')
    .get(/*authenticate('token').always, checkPermission('product_select', 'products'),*/ products.subindexes)
    .put(authenticate('token').always, jsonParser, /*checkPermission('product_update', 'products'),*/ products.editSubindexes);

router.route('/:realm/v0.2/products/:ticket/export.csv')
    .get(/*authenticate('token').always,*/ products.export);

router.route('/:realm/v0.2/products/:id/export_ticket')
    .get(/*authenticate('token').always,*/ products.getTicket);

router.route('/:realm/v0.2/products/:id/uoa')
    .get(authenticate('token').always, checkRight('product_uoa'), products.UOAselect)
    .post(authenticate('token').always, jsonParser, checkRight('product_uoa'), products.UOAaddMultiple);

router.route('/:realm/v0.2/products/:id/uoa/:uoaid')
    .delete(authenticate('token').always, checkRight('product_uoa'), products.UOAdelete)
    .post(authenticate('token').always, jsonParser, checkRight('product_uoa'), products.UOAadd);

router.route('/:realm/v0.2/products/:id/move/:uoaid')
    .get(authenticate('token').always, products.productUOAmove);

//----------------------------------------------------------------------------------------------------------------------
//    ORGANIZATIONS
//----------------------------------------------------------------------------------------------------------------------
var users = require('app/controllers/users');
var organizations = require('app/controllers/organizations');

router.route('/:realm/v0.2/organizations')
    .get(authenticate('token').always, organizations.select)
    .post(authenticate('token').always, jsonParser, checkRight('organization_new'), organizations.insertOne);

router.route('/:realm/v0.2/organizations/:id')
    .get(authenticate('token').always, organizations.selectOne)
    .put(authenticate('token').always, jsonParser, organizations.editOne);

router.route('/:realm/v0.2/organizations/:id/products')
    .get(authenticate('token').always, organizations.selectProducts)

router.route('/:realm/v0.2/organizations/:id/users_csv')
    .post(authenticate('token').always, jsonParser, organizations.csvUsers);

router.route('/:realm/v0.2/users/self/organization')
    .get(authenticate('token').always, users.selfOrganization)
    .put(authenticate('token').always, jsonParser, users.selfOrganizationUpdate);

router.route('/:realm/v0.2/users/self/organization/invite')
    .post(authenticate('token').always, jsonParser, users.selfOrganizationInvite);

router.route('/:realm/v0.2/users/self/tasks')
    .get(authenticate('token').always, users.tasks);

//----------------------------------------------------------------------------------------------------------------------
// USERS
//----------------------------------------------------------------------------------------------------------------------

router.route('/:realm/v0.2/users')
    .get(authenticate('token').always, checkRight('rights_view_all'), users.select)
    .post(authenticate('token').ifPossible, jsonParser, users.insertOne);

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
    .post(authenticate('token').always, jsonParser, /*checkRight('users_logout_self'),*/ users.logout);

router.route('/:realm/v0.2/users/invite')
    .post(authenticate('token').always, jsonParser, checkRight('users_invite'), users.invite);

router.route('/:realm/v0.2/users/logout/:id')
    .post(authenticate('token').always, jsonParser, checkRight('users_logout'), users.logout);

router.route('/:realm/v0.2/users/self')
    .get(authenticate('token').always, /*checkRight('users_view_self'), */ users.selectSelf)
    .put(authenticate('token').always, jsonParser, /*checkRight('users_edit_self'), */ users.updateSelf);

router.route('/:realm/v0.2/users/:id')
    .get(authenticate('token').always, checkRight('users_view_one'), users.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('users_edit_one'), users.updateOne)
    .delete(authenticate('token').always, checkRight('users_delete_one'), users.deleteOne);

router.route('/:realm/v0.2/users/:id/uoa')
    .get(authenticate('token').always, checkRight('users_uoa'), users.UOAselect)
    .post(authenticate('token').always, jsonParser, checkRight('users_uoa'), users.UOAaddMultiple)
    .delete(authenticate('token').always, checkRight('users_uoa'), users.UOAdeleteMultiple);

router.route('/:realm/v0.2/users/:id/uoa/:uoaid')
    .delete(authenticate('token').always, checkRight('users_uoa'), users.UOAdelete)
    .post(authenticate('token').always, jsonParser, checkRight('users_uoa'), users.UOAadd);

//----------------------------------------------------------------------------------------------------------------------
//    GROUPS
//----------------------------------------------------------------------------------------------------------------------

var groups = require('app/controllers/groups');

router.route('/:realm/v0.2/organizations/:organizationId/groups')
    .get(authenticate('token').always, groups.selectByOrg)
    .post(authenticate('token').always, jsonParser, groups.insertOne);

router.route('/:realm/v0.2/groups/:id')
    .get(authenticate('token').always, groups.selectOne)
    .put(authenticate('token').always, jsonParser, groups.updateOne)
    .delete(authenticate('token').always, checkRight('groups_delete'), groups.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    COUNTRIES
//----------------------------------------------------------------------------------------------------------------------
var countries = require('app/controllers/countries');

router.route('/:realm/v0.2/countries')
    .get(authenticate('token').always, countries.select)
    .post(authenticate('token').always, jsonParser, checkRight('countries_insert_one'), countries.insertOne);

router.route('/:realm/v0.2/countries/:id')
    .put(authenticate('token').always, jsonParser, checkRight('countries_update_one'), countries.updateOne)
    .delete(authenticate('token').always, checkRight('countries_delete_one'), countries.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    WORKFLOWS
//----------------------------------------------------------------------------------------------------------------------
var workflows = require('app/controllers/workflows');

router.route('/:realm/v0.2/workflows')
    .get(authenticate('token').always, workflows.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('countries_insert_one'),*/ workflows.insertOne);

router.route('/:realm/v0.2/workflows/:id')
    .get(authenticate('token').always, /*checkRight('countries_update_one'),*/ workflows.selectOne)
    .put(authenticate('token').always, jsonParser, /*checkRight('countries_update_one'),*/ workflows.updateOne)
    .delete(authenticate('token').always, /*checkRight('countries_delete_one'),*/ workflows.deleteOne);

router.route('/:realm/v0.2/workflows/:id/steps')
    .get(authenticate('token').always, workflows.steps)
    //.delete(authenticate('token').always, workflows.stepsDelete)
    .put(authenticate('token').always, jsonParser, workflows.stepsUpdate);

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
var discussions = require('app/controllers/discussions');

router.route('/:realm/v0.2/discussions')
    .get(authenticate('token').always, discussions.select)
    .post(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.insertOne);
router.route('/:realm/v0.2/discussions/users/:taskId')
    .get(authenticate('token').always, discussions.getUsers);
router.route('/:realm/v0.2/discussions/entryscope')
    .get(authenticate('token').always, discussions.getEntryScope);
router.route('/:realm/v0.2/discussions/entryscope/:id')
    .get(authenticate('token').always, discussions.getEntryUpdate);
router.route('/:realm/v0.2/discussions/:id')
    .put(authenticate('token').always, jsonParser, /*checkRight('rights_view_all'),*/ discussions.updateOne)
    .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ discussions.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    NOTIFICATIONS
//----------------------------------------------------------------------------------------------------------------------
var notifications = require('app/controllers/notifications');

router.route('/:realm/v0.2/notifications')
    .get(authenticate('token').always, notifications.select)
    .post(authenticate('token').always, jsonParser, notifications.insertOne);
router.route('/:realm/v0.2/notifications/reply/:notificationId')
    .post(authenticate('token').always, jsonParser, notifications.reply, notifications.insertOne);
router.route('/:realm/v0.2/notifications/users')
    .get(authenticate('token').always, notifications.users);
router.route('/:realm/v0.2/notifications/resend/:notificationId')
    .put(authenticate('token').always, jsonParser, notifications.resend);
router.route('/:realm/v0.2/notifications/resenduserinvite/:userId')
    .put(authenticate('token').always, jsonParser, notifications.resendUserInvite);
router.route('/:realm/v0.2/notifications/markread/:notificationId')
    .put(authenticate('token').always, jsonParser, notifications.changeRead(true), notifications.markReadUnread);
router.route('/:realm/v0.2/notifications/markunread/:notificationId')
    .put(authenticate('token').always, jsonParser, notifications.changeRead(false), notifications.markReadUnread);
router.route('/:realm/v0.2/notifications/markallread')
    .put(authenticate('token').always, jsonParser, notifications.markAllRead);
router.route('/:realm/v0.2/notifications/delete')
    .delete(authenticate('token').always, notifications.deleteList);

//----------------------------------------------------------------------------------------------------------------------
//    Units of Analysis
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysis = require('app/controllers/uoas');

router.route('/:realm/v0.2/uoas')
    .get(authenticate('token').always, UnitOfAnalysis.select)
    .post(authenticate('token').always, jsonParser, checkRight('unitofanalysis_insert_one'), UnitOfAnalysis.insertOne);

router.route('/:realm/v0.2/uoas/:id')
    .get(authenticate('token').always, UnitOfAnalysis.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('unitofanalysis_update_one'), UnitOfAnalysis.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysis_delete_one'), UnitOfAnalysis.deleteOne);

router.route('/:realm/v0.2/import_uoas_csv')
    .post(authenticate('token').ifPossible, jsonParser, UnitOfAnalysis.csvImport);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisType = require('app/controllers/uoatypes');

router.route('/:realm/v0.2/uoatypes')
    .get(authenticate('token').always, UnitOfAnalysisType.select)
    .post(authenticate('token').always, jsonParser, checkRight('unitofanalysistype_insert_one'), UnitOfAnalysisType.insertOne);

router.route('/:realm/v0.2/uoatypes/:id')
    .get(authenticate('token').always, UnitOfAnalysisType.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('unitofanalysistype_update_one'), UnitOfAnalysisType.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysistype_delete_one'), UnitOfAnalysisType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Classification Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisClassType = require('app/controllers/uoaclasstypes');

router.route('/:realm/v0.2/uoaclasstypes')
    .get(authenticate('token').always, UnitOfAnalysisClassType.select)
    .post(authenticate('token').always, jsonParser, checkRight('unitofanalysisclasstype_insert_one'), UnitOfAnalysisClassType.insertOne);

router.route('/:realm/v0.2/uoaclasstypes/:id')
    .get(authenticate('token').always, UnitOfAnalysisClassType.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('unitofanalysisclasstype_update_one'), UnitOfAnalysisClassType.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysisclasstype_delete_one'), UnitOfAnalysisClassType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Tags
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTag = require('app/controllers/uoatags');

router.route('/:realm/v0.2/uoatags')
    .get(authenticate('token').always, UnitOfAnalysisTag.select)
    .post(authenticate('token').always, jsonParser, checkRight('unitofanalysistag_insert_one'), UnitOfAnalysisTag.insertOne);

router.route('/:realm/v0.2/uoatags/:id')
    .get(authenticate('token').always, UnitOfAnalysisTag.selectOne)
    .put(authenticate('token').always, jsonParser, checkRight('unitofanalysistag_update_one'), UnitOfAnalysisTag.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysistag_delete_one'), UnitOfAnalysisTag.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis to Tags Link
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisTagLink = require('app/controllers/uoataglinks');

router.route('/:realm/v0.2/uoataglinks')
    .get(authenticate('token').always, UnitOfAnalysisTagLink.select)
    .post(authenticate('token').always, jsonParser, checkRight('uoataglink_insert_one'), UnitOfAnalysisTagLink.checkInsert, UnitOfAnalysisTagLink.insertOne);

router.route('/:realm/v0.2/uoataglinks/:id')
    .delete(authenticate('token').always, checkRight('uoataglink_delete_one'), UnitOfAnalysisTagLink.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Visualizations
//----------------------------------------------------------------------------------------------------------------------
var Visualization = require('app/controllers/visualizations');
var ComparativeVisualization = require('app/controllers/comparative_visualizations');

router.route('/:realm/v0.2/organizations/:organizationId/visualizations')
    .get(authenticate('token').always, Visualization.select)
    .post(authenticate('token').always, jsonParser, /*checkRight(), */ Visualization.insertOne);

router.route('/:realm/v0.2/organizations/:organizationId/visualizations/:id')
    .get(authenticate('token').always, Visualization.selectOne)
    .put(authenticate('token').always, jsonParser, /*checkRight(), */ Visualization.updateOne)
    .delete(authenticate('token').always, /*checkRight(), */ Visualization.deleteOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations')
    .get(/*authenticate('token').always,*/ ComparativeVisualization.select)
    .post(authenticate('token').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id')
    .get(/*authenticate('token').always,*/ ComparativeVisualization.selectOne)
    .put(authenticate('token').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateOne)
    .delete(authenticate('token').always, /*checkRight(), */ ComparativeVisualization.deleteOne);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/datasets')
    .get(/*authenticate('token').always,*/ ComparativeVisualization.selectDatasets)
    .post(authenticate('token').always, jsonParser, /*checkRight(), */ ComparativeVisualization.insertDataset);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/datasets/parse')
    .post(authenticate('token').always, jsonParser, /*checkRight(), */ ComparativeVisualization.parseDataset);

router.route('/:realm/v0.2/organizations/:organizationId/comparative_visualizations/:id/:datasets/:datasetId')
    .get(/*authenticate('token').always,*/ ComparativeVisualization.selectDataset)
    .put(authenticate('token').always, jsonParser, /*checkRight(), */ ComparativeVisualization.updateDataset)
    .delete(authenticate('token').always, /*checkRight(), */ ComparativeVisualization.deleteDataset);

//----------------------------------------------------------------------------------------------------------------------
//    Data Export
//----------------------------------------------------------------------------------------------------------------------
var DataExport = require('app/controllers/data_export');

router.route('/:realm/v0.2/data-api/datasets')
    .get(DataExport.authenticate, DataExport.select);

router.route('/:realm/v0.2/data-api/datasets/:id')
    .get(DataExport.authenticate, DataExport.selectOne);

module.exports = router;

//----------------------------------------------------------------------------------------------------------------------
//    LOGS
//----------------------------------------------------------------------------------------------------------------------
var logs = require('app/controllers/logs');

router.route('/:realm/v0.2/logs')
    .get(authenticate('token').always, logs.select);
