var express = require('express'),
  authenticate = require('app/auth').authenticate,
  authorize = require('app/auth').authorize,
  checkRight = require('app/auth').checkRight,
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

router.route('/v0.2/role/:roleID/rights')
  .get(authenticate('token').always, checkRight('role_rights_view_one'), role_rights.select);

router.route('/v0.2/role/:roleID/rights/:rightID')
  .post(authenticate('token').always, checkRight('role_rights_add'), role_rights.insertOne)
  .delete(authenticate('token').always, checkRight('role_rights_delete'), role_rights.deleteOne);


//----------------------------------------------------------------------------------------------------------------------
// USERS
//----------------------------------------------------------------------------------------------------------------------
var users = require('app/controllers/users');

router.route('/v0.2/users')
  .get(authenticate('token').always, checkRight('rights_view_all'), users.select)
  .post(authenticate('token').ifPossible, users.insertOne);

router.route('/v0.2/users/token')
  .get(authenticate('basic').always, /*checkRight('users_token'),*/ users.token);

router.route('/v0.2/users/forgot')
  .post(users.forgot);

router.route('/v0.2/users/reset-password')
  .put(users.resetPassword);

router.route('/v0.2/users/check_restore_token/:token')
  .get(users.checkRestoreToken);

router.route('/v0.2/users/logout')
  .post(authenticate('token').always, checkRight('users_logout_self'), users.logout);

router.route('/v0.2/users/logout/:id')
  .post(authenticate('token').always, checkRight('users_logout'), users.logout);

router.route('/v0.2/users/self')
  .get(authenticate('token').always, /*checkRight('users_view_self'), */users.selectSelf)
  .put(authenticate('token').always, checkRight('users_edit_self'), users.updateSelf);

router.route('/v0.2/users/:id')
  .get(authenticate('token').always, checkRight('users_view_one'), users.selectOne)
  .put(authenticate('token').always, checkRight('users_edit_one'), users.updateOne)
  .delete(authenticate('token').always, checkRight('users_delete_one'), users.deleteOne);

module.exports = router;


