/**
 * Rights tests
 *
 * prerequsites tests: organizations, users, roles, rights
 *
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
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.api_base = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var token;
var obj = {};
var path = '/roles';
var numberOfRecords = 24;
var insertItem = {};
var testTitle = 'Role-Rights: ';
var errRoleId = 999;
var errRightId = 999;

describe(testTitle, function () {

    before(function (done) {
        // authorize users
        // allUsers.concat(config.testEntities.users);
        allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                done();
            },
            (err) => done(err)
        );
    });

    function userTests(user) {
        describe(testTitle + 'All of tests for user `' + user.firstName + '`', function () {
            // ordinary users does not have rights to view role_rights
            it('(Err) No rights to select for ordinary users', function (done) {
                ithelper.getCheckRights(testEnv.api_created_realm, '/roles/3/rights', user.token, 400, 401, 'User\'s role has not permission for this action(s)', done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle + 'All of tests for admin `' + user.firstName + '`', function () {
            if (user.roleID === 1) {
                it('Select true number of records for SuperAdmin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/1/rights', user.token, 200, 0, done);
                });
            } else if (user.roleID === 2) {
                it('Select true number of records for Admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/2/rights', user.token, 200, numberOfRecords, done);
                });
            }
            describe(testTitle + 'Prepare for main tests - creating Roles and Rights ', function () {
                it('CRUD: Create new Role - "testRole" (non Sysytem)', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, '/roles', user.token, {
                        name: 'testRole'
                    }, 201, obj, 'roleTestId', done);
                });
                it('CRUD: Create new Role - "systemRole" (Sysytem)', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, '/roles', user.token, {
                        name: 'systemRole',
                        isSystem: true
                    }, 201, obj, 'roleSystemId', done);
                });
                it('CRUD: Create new Right - "testRight"', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, '/rights', user.token, {
                        action: 'testRight',
                        description: 'test Right Description'
                    }, 201, obj, 'rightTestId', done);
                });
            });
            describe(testTitle + 'Main tests ', function () {
                it('(Err) Create new Role-Right - "This role does not exist"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/' + errRoleId + '/rights/' + obj.rightTestId,
                        user.token,
                        insertItem,
                        400,
                        400,
                        'This role does not exist',
                        done
                    );
                });
                it('(Err) Create new Role-Right - "This right does not exist"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/' + obj.roleTestId + '/rights/' + errRightId,
                        user.token,
                        insertItem,
                        400,
                        400,
                        'This right does not exist',
                        done
                    );
                });
                it('(Err) Create new Role-Right - "You can add right only to system roles. For simple roles use access matrices"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/' + obj.roleTestId + '/rights/' + obj.rightTestId,
                        user.token,
                        insertItem,
                        400,
                        400,
                        'You can add right only to system roles. For simple roles use access matrices',
                        done
                    );
                });
                it('Create new Role-Right - SUCCESS', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, '/roles/' + obj.roleSystemId + '/rights/' + obj.rightTestId, user.token, insertItem, 201, obj, 'id', done);
                });
                it('(Err) Create new Role-Right - "Role allready has this right"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/' + obj.roleSystemId + '/rights/' + obj.rightTestId,
                        user.token,
                        insertItem,
                        400,
                        106,
                        'Role allready has this right',
                        done
                    );
                });
                it('Select true number of records (after creating)', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/' + obj.roleSystemId + '/rights', user.token, 200, 1, done);
                });
                it('(Err) Delete Right - "Restriction "rolesrights_rightID"', function (done) {
                    ithelper.deleteOneErrMessage(
                        testEnv.api_created_realm,
                        '/rights/' + obj.rightTestId,
                        user.token,
                        400,
                        '23503',
                        'rolesrights_rightID',
                        done
                    );
                });
                it('(Err) Delete Right - "Restriction "RolesRights_roleID_fkey"', function (done) {
                    ithelper.deleteOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/' + obj.roleSystemId,
                        user.token,
                        400,
                        '23503',
                        'RolesRights_roleID_fkey',
                        done
                    );
                });
                it('Delete created Role-Right', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, '/roles/' + obj.roleSystemId + '/rights/' + obj.rightTestId, user.token, 204, done);
                });
                it('Select true number of records (after deleting)', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/' + obj.roleSystemId + '/rights', user.token, 200, 0, done);
                });
            });
            describe(testTitle + 'Clean up after main tests - deleting Roles and Rights ', function () {
                it('Delete system role', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, '/roles/' + obj.roleSystemId, user.token, 204, done);
                });
                it('Delete test role', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, '/roles/' + obj.roleTestId, user.token, 204, done);
                });
                it('Delete test right', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, '/rights/' + obj.rightTestId, user.token, 204, done);
                });
            });
        });
    }

    it(testTitle + 'start', function (done) {
        adminTests(ithelper.getUser(allUsers, 1));
        adminTests(ithelper.getUser(allUsers, 2));
        for (var i = 0; i < config.testEntities.users.length; i++) {
            userTests(ithelper.getUser(allUsers, 3, i + 1));
        }
        done();
    });

});
