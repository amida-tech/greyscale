var express = require('express'),
  authenticate = require('app/auth').authenticate,
  authorize = require('app/auth').authorize,
  checkRight = require('app/auth').checkRight,
  checkPermission = require('app/auth').checkPermission,
  router = express.Router();


//----------------------------------------------------------------------------------------------------------------------
//    ROLES
//----------------------------------------------------------------------------------------------------------------------
var roles = require('app/controllers/roles');

router.route('/v0.2/roles')
  .get(authenticate('token').ifPossible, roles.select)
  .post(authenticate('token').ifPossible, roles.insertOne);

router.route('/v0.2/roles/:id')
  .get(authenticate('token').ifPossible, roles.selectOne)
  .put(authenticate('token').ifPossible, roles.updateOne);

//----------------------------------------------------------------------------------------------------------------------
//    RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var rights = require('app/controllers/rights');

router.route('/v0.2/rights')
  .get(authenticate('token').always, checkRight('rights_view_all'), rights.select)
  .post(authenticate('token').always, checkRight('rights_add_one'), rights.insertOne);

router.route('/v0.2/rights/:id')
  .get(authenticate('token').always, checkRight('rights_view_one'), rights.selectOne)
  .put(authenticate('token').always, checkRight('rights_edit_one'), rights.updateOne)
  .delete(authenticate('token').always, checkRight('rights_delete_one'), rights.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    ROLE RIGHTS
//----------------------------------------------------------------------------------------------------------------------
var role_rights = require('app/controllers/role_rights');

router.route('/v0.2/roles/:roleID/rights')
  .get(authenticate('token').always, checkRight('role_rights_view_one'), role_rights.select);

router.route('/v0.2/roles/:roleID/rights/:rightID')
  .post(authenticate('token').always, checkRight('role_rights_add'), role_rights.insertOne)
  .delete(authenticate('token').always, checkRight('role_rights_delete'), role_rights.deleteOne);


//----------------------------------------------------------------------------------------------------------------------
//    ESSENCES
//----------------------------------------------------------------------------------------------------------------------
var essences = require('app/controllers/essences');

router.route('/v0.2/essences')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essences.select)
  .post(authenticate('token').always, /*checkRight('rights_view_all'),*/ essences.insertOne);


//----------------------------------------------------------------------------------------------------------------------
//    PROJECTS
//----------------------------------------------------------------------------------------------------------------------
var projects = require('app/controllers/projects');

router.route('/v0.2/essences')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ projects.select);
  //.post(authenticate('token').always, /*checkRight('rights_view_all'),*/ essences.insertOne);


//----------------------------------------------------------------------------------------------------------------------
//    ESSENCE_ROLES
//----------------------------------------------------------------------------------------------------------------------
var essence_roles = require('app/controllers/essence_roles');

router.route('/v0.2/essence_roles')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essence_roles.select)
  .post(authenticate('token').always, /*checkRight('rights_view_all'),*/ essence_roles.insertOne);

router.route('/v0.2/essence_roles/:essenceId/:entityId')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ essence_roles.selectEntityRoles);

//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_MATRICES
//----------------------------------------------------------------------------------------------------------------------
var access_matrices = require('app/controllers/access_matrices');

router.route('/v0.2/access_matrices')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ access_matrices.select)
  .post(authenticate('token').always, /*checkRight('rights_view_all'),*/ access_matrices.insertOne);

router.route('/v0.2/access_matrices/:id/permissions')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ access_matrices.permissionsSelect);


//----------------------------------------------------------------------------------------------------------------------
//    ACCESS_PERMISSIONS
//----------------------------------------------------------------------------------------------------------------------
router.route('/v0.2/access_permissions')
  .post(authenticate('token').always, /*checkRight('rights_view_all'),*/ access_matrices.permissionsInsertOne);

router.route('/v0.2/access_permissions/:id')
  .delete(authenticate('token').always, /*checkRight('rights_view_all'),*/ access_matrices.permissionsDeleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    LANGUAGES
//----------------------------------------------------------------------------------------------------------------------
var languages = require('app/controllers/languages');

router.route('/v0.2/languages')
  .get(authenticate('token').always, languages.select)
  .post(authenticate('token').always, languages.insertOne);

router.route('/v0.2/languages/:id')
  .get(authenticate('token').always, languages.selectOne)
  .put(authenticate('token').always, languages.editOne)
  .delete(authenticate('token').always, languages.delete);

//----------------------------------------------------------------------------------------------------------------------
//    TRANSLATIONS
//----------------------------------------------------------------------------------------------------------------------
var translations = require('app/controllers/translations');
router.route('/v0.2/translations')
  .get(authenticate('token').always, translations.select)
  .post(authenticate('token').always, translations.insertOne);

router.route('/v0.2/translations/:essenceId/:entityId/:field/:langId')
  .delete(authenticate('token').always,/*checkPermission('product_delete','products'),*/ translations.delete)
  .put(authenticate('token').always,/*checkPermission('product_delete','products'),*/ translations.editOne);

router.route('/v0.2/translations/:essenceId')
  .get(authenticate('token').always, translations.selectByParams);

router.route('/v0.2/translations/:essenceId/:entityId')
  .get(authenticate('token').always, translations.selectByParams);
//----------------------------------------------------------------------------------------------------------------------
//    PRODUCTS
//----------------------------------------------------------------------------------------------------------------------
var products = require('app/controllers/products');
router.route('/v0.2/products')
  .get(authenticate('token').always, /*checkRight('rights_view_all'),*/ products.select)
  .post(authenticate('token').always, products.insertOne);


router.route('/v0.2/products/:id')
  .get(authenticate('token').always,checkPermission('product_select','products'),products.selectOne)
  .delete(authenticate('token').always,checkPermission('product_delete','products'),products.delete);

//----------------------------------------------------------------------------------------------------------------------
//    ORGANIZATIONS
//----------------------------------------------------------------------------------------------------------------------
var users = require('app/controllers/users');
var organizations = require('app/controllers/organizations');

router.route('/v0.2/organizations')
  .post(authenticate('token').always,organizations.insertOne);

router.route('/v0.2/users/self/organization')
  .get(authenticate('token').always, users.selfOrganization)
  .put(authenticate('token').always, users.selfOrganizationUpdate);

router.route('/v0.2/users/self/organization/invite')
  .post(authenticate('token').always, users.selfOrganizationInvite);

//----------------------------------------------------------------------------------------------------------------------
// USERS
//----------------------------------------------------------------------------------------------------------------------

router.route('/v0.2/users')
  .get(authenticate('token').always, checkRight('rights_view_all'), users.select)
  .post(authenticate('token').ifPossible, users.insertOne);

router.route('/v0.2/users/token')
  .get(authenticate('basic').always, /*checkRight('users_token'),*/ users.token);


router.route('/v0.2/users/checkToken/:token')
  .get(users.checkToken);

router.route('/v0.2/users/forgot')
  .post(users.forgot);

router.route('/v0.2/users/reset-password')
  .put(users.resetPassword);

router.route('/v0.2/users/activate/:token')
  .get(users.checkActivationToken)
  .post(users.activate);



router.route('/v0.2/users/check_restore_token/:token')
  .get(users.checkRestoreToken);

router.route('/v0.2/users/logout')
  .post(authenticate('token').always, /*checkRight('users_logout_self'),*/ users.logout);

router.route('/v0.2/users/invite')
  .post(authenticate('token').always, checkRight('users_invite'), users.invite);

router.route('/v0.2/users/logout/:id')
  .post(authenticate('token').always, checkRight('users_logout'), users.logout);

router.route('/v0.2/users/self')
  .get(authenticate('token').always, /*checkRight('users_view_self'), */users.selectSelf)
  .put(authenticate('token').always, checkRight('users_edit_self'), users.updateSelf);

router.route('/v0.2/users/:id')
  .get(authenticate('token').always, checkRight('users_view_one'), users.selectOne)
  .put(authenticate('token').always, checkRight('users_edit_one'), users.updateOne)
  .delete(authenticate('token').always, checkRight('users_delete_one'), users.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    COUNTRIES
//----------------------------------------------------------------------------------------------------------------------
var countries = require('app/controllers/countries');

router.route('/v0.2/countries')
    .get(authenticate('token').always, countries.select)
    .post(authenticate('token').always, checkRight('countries_insert_one'), countries.insertOne);

router.route('/v0.2/countries/:id')
    .put(authenticate('token').always, checkRight('countries_update_one'), countries.updateOne)
    .delete(authenticate('token').always, checkRight('countries_delete_one'), countries.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Units of Analysis
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysis = require('app/controllers/uoas');

router.route('/v0.2/uoas')
    .get(authenticate('token').always, UnitOfAnalysis.select)
    .post(authenticate('token').always, checkRight('unitofanalysis_insert_one'), UnitOfAnalysis.insertOne);

router.route('/v0.2/uoas/:id')
    .put(authenticate('token').always, checkRight('unitofanalysis_update_one'), UnitOfAnalysis.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysis_delete_one'), UnitOfAnalysis.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
//    Unit of Analysis Types
//----------------------------------------------------------------------------------------------------------------------
var UnitOfAnalysisType = require('app/controllers/uoatypes');

router.route('/v0.2/uoatypes')
    .get(authenticate('token').always, UnitOfAnalysisType.select)
    .post(authenticate('token').always, checkRight('unitofanalysistype_insert_one'), UnitOfAnalysisType.insertOne);

router.route('/v0.2/uoatypes/:id')
    .put(authenticate('token').always, checkRight('unitofanalysistype_update_one'), UnitOfAnalysisType.updateOne)
    .delete(authenticate('token').always, checkRight('unitofanalysistype_delete_one'), UnitOfAnalysisType.deleteOne);

//----------------------------------------------------------------------------------------------------------------------
module.exports = router;


