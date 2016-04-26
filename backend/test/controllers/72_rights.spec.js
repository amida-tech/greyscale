/**
 * Rights tests
 *
 * prerequsites tests: organizations, users
 *
 * used entities: organization, users, roles
 //[
 //{action: 'rights_view_all'},
 //{action: 'rights_add_one'},
 //{action: 'rights_view_one'},
 //{action: 'rights_delete_one'},
 //{action: 'rights_edit_one'},
 //{action: 'users_view_all'},
 //{action: 'users_edit_one'},
 //{action: 'users_view_one'},
 //{action: 'users_delete_one'},
 //{action: 'users_token'},
 //{action: 'users_logout_self'},
 //{action: 'users_logout'},
 //{action: 'users_view_self'},
 //{action: 'users_edit_self'},
 //{action: 'role_rights_view_one'},
 //{action: 'role_rights_add'},
 //{action: 'product_delete', essenceId: 4},
 //{action: 'users_uoa'},
 //{action: 'product_uoa', essenceId: 4},
 //{action: 'users_invite'},
 //{action: 'unitofanalysis_insert_one', essenceId: 6},
 //{action: 'unitofanalysis_update_one', essenceId: 6},
 //{action: 'unitofanalysis_delete_one', essenceId: 6},
 //{action: 'groups_delete'}
 //];
 *
 * created:
 *
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config');
var ithelper = require('./itHelper');
var request = require('supertest');
var _ = require('underscore');

var testEnv = {};
testEnv.superAdmin   = config.testEntities.superAdmin;
testEnv.admin        = config.testEntities.admin;
testEnv.users        = config.testEntities.users;
testEnv.organization = config.testEntities.organization;

testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.api_base          = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api               = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + testEnv.organization.realm + '/v0.2');

var token;
var obj ={};
var path = '/rights';
var rightsContent = [
    {action: 'rights_view_all'},
    {action: 'rights_add_one'},
    {action: 'rights_view_one'},
    {action: 'rights_delete_one'},
    {action: 'rights_edit_one'},
    {action: 'users_view_all'},
    {action: 'users_edit_one'},
    {action: 'users_view_one'},
    {action: 'users_delete_one'},
    {action: 'users_token'},
    {action: 'users_logout_self'},
    {action: 'users_logout'},
    {action: 'users_view_self'},
    {action: 'users_edit_self'},
    {action: 'role_rights_view_one'},
    {action: 'role_rights_add'},
    {action: 'product_delete', essenceId: 4},
    {action: 'users_uoa'},
    {action: 'product_uoa', essenceId: 4},
    {action: 'users_invite'},
    {action: 'unitofanalysis_insert_one', essenceId: 6},
    {action: 'unitofanalysis_update_one', essenceId: 6},
    {action: 'unitofanalysis_delete_one', essenceId: 6},
    {action: 'groups_delete'}
];
var numberOfRecords = 24;
var insertItem = {action: 'testRight', description: 'test Right Description'};
var updateItem = {action: 'rightTest', description: 'Right Test Description'};

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']);

describe('Rights:', function () {

    function allTests(user, token) {
        describe('All of tests for user: ' + user.firstName, function () {
            if (user.roleID < 3) {
                it('Select: true number of records', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
                });

                it('Select initial content', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, token, 200, rightsContent, done);
                });
            } else {
                // ordinary users does not have rights to view rights
                it('(Err) No rights to select for ordinary users', function (done) {
                    ithelper.getCheckRights(testEnv.api_created_realm, path, token, 400, 401, 'User\'s role has not permission for this action(s): rights_view_all', done);
                });
            }
            if (user.roleID === 1) {
                it('CRUD: Create new Right - "testRight"', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'id', done);
                    numberOfRecords++;
                });
                it('CRUD: Get created Right', function (done) {
                    ithelper.selectOneCheckFields(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, insertItem, done);
                });
                it('CRUD: Update Right', function (done) {
                    ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, token, updateItem, 202, done);
                });
                it('CRUD: Get updated Role', function (done) {
                    ithelper.selectOneCheckFields(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, updateItem, done);
                });
                it('CRUD: True number of records after insert', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
                });
                it('Select new content', function (done) {
                    rightsContent.push(updateItem);
                    ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, token, 200, rightsContent, done);
                });
                it('Delete test right', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, token, 204, done);
                    rightsContent.splice(-1,1);
                    numberOfRecords--;
                });
                it('Select: true number of records (after delete)', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
                });
            }
        });
    }

    function makeTests(user) {
        it('Authorize user ' + user.firstName, function(done) {
            var api = (user.roleID === 1) ? testEnv.api : testEnv.api_created_realm;
            api
                .get('/users/token')
                .set('Authorization', 'Basic ' + new Buffer(user.email + ':' + user.password).toString('base64'))
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return err;
                    }
                    expect(res.body.token).to.exist;
                    token = res.body.token;
                    describe('Get test environment objects', function () {
                        it('Get to uoatypes ***', function (done) {
                            if (_.isEmpty(obj)){
                                obj = _.extend({},config.testEntities.obj);
                                //console.log(obj);
                            }
                            done();
                        });
                    });
                    allTests(user, token);
                    done();
                });
        });

    }

    for (var i = 0; i < testEnv.allUsers.length; i++) {
        makeTests(testEnv.allUsers[i]);
    }

});
