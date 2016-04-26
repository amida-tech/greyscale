/**
 * Roles tests
 *
 * prerequsites tests: organizations, users
 *
 * used entities: organization, users, roles
 //[
 //{name: 'admin', isSystem: true},
 //{name: 'client', isSystem: true},
 //{name: 'user', isSystem: true}
 //];
 *
 * created: new role
 //[
 //{name: 'admin', isSystem: true},
 //{name: 'client', isSystem: true},
 //{name: 'user', isSystem: true}
 //{name: 'roleTest', isSystem: false}
 //];
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
var rolesContent = [
    {id: 1, name: 'admin', isSystem: true},
    {id: 2, name: 'client', isSystem: true},
    {id: 3, name: 'user', isSystem: true}
];
var numberOfRecords = 3;

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']);

describe('Roles:', function () {

    function allTests(user, token) {
        describe('All of tests for user: ' + user.firstName, function () {
            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
            });

            it('Select initial content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, token, 200, rolesContent, done);
            });
            if (user.roleID === 1) {
                it('CRUD: Create new Role - "testRole"', function (done) {
                    var insertItem = {name: 'testRole'};
                    ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'id', done);
                    numberOfRecords++;
                });
                it('CRUD: Get created Role', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, 'name', 'testRole', done);
                });
                it('CRUD: Update Role', function (done) {
                    var updateItem = {name: 'roleTest'};
                    ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, token, updateItem, 202, done);
                });
                it('CRUD: Get updated Role', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, 'name', 'roleTest', done);
                });
                it('CRUD: True number of records after insert', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
                });
                it('Select new content', function (done) {
                    rolesContent.push({name: 'roleTest', isSystem: false});
                    ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, token, 200, rolesContent, done);
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
