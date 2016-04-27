/**
 * Rights tests
 *
 * prerequsites tests: organizations, users, roles
 *
 * used entities: organization, users, role {name: 'roleTest'}, right {action: 'rightTest'}
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
var path = '/roles';
var numberOfRecords = 24;
var insertItem = {};
var testTitle = 'Role-Rights: ';
var errRoleId = 999;
var errRightId = 999;

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']);

describe(testTitle, function () {

    function allTests(user, token) {
        describe(testTitle+'All of tests for user ' + user.firstName, function () {
            if (user.roleID === 1) {
                it('Select true number of records for SuperAdmin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/1/rights', token, 200, 0, done);
                });
            } else if (user.roleID === 2) {
                it('Select true number of records for Admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/2/rights', token, 200, numberOfRecords, done);
                });
            } else {
                // ordinary users does not have rights to view role_rights
                it('(Err) No rights to select for ordinary users', function (done) {
                    ithelper.getCheckRights(testEnv.api_created_realm, '/roles/3/rights', token, 400, 401, 'User\'s role has not permission for this action(s)', done);
                });
            }
            if (user.roleID === 1) { // only for SuperAdmin
                it('(Err) Create new Role-Right - "This role does not exist"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/'+errRoleId+'/rights/'+obj.right.testId,
                        token,
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
                        '/roles/'+obj.role.testId+'/rights/'+errRightId,
                        token,
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
                        '/roles/'+obj.role.testId+'/rights/'+obj.right.testId,
                        token,
                        insertItem,
                        400,
                        400,
                        'You can add right only to system roles. For simple roles use access matrices',
                        done
                    );
                });
                it('Create new Role-Right - SUCCESS', function (done) {
                    ithelper.insertOne(testEnv.api_created_realm, '/roles/'+obj.role.systemId+'/rights/'+obj.right.testId, token, insertItem, 201, obj, 'id', done);
                });
                it('(Err) Create new Role-Right - "Role allready has this right"', function (done) {
                    ithelper.insertOneErrMessage(
                        testEnv.api_created_realm,
                        '/roles/'+obj.role.systemId+'/rights/'+obj.right.testId,
                        token,
                        insertItem,
                        400,
                        106,
                        'Role allready has this right',
                        done
                    );
                });
                it('Select true number of records (after creating)', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/'+obj.role.systemId+'/rights', token, 200, 1, done);
                });
                it('Delete created Role-Right', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, '/roles/'+obj.role.systemId+'/rights/'+obj.right.testId, token, 204, done);
                });
                it('Select true number of records (after deleting)', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, '/roles/'+obj.role.systemId+'/rights', token, 200, 0, done);
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
                    describe('', function () {
                        it('Get test environment objects to role_rights <- config.testEntities.obj', function (done) {
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
