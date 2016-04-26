/**
 * Unit of Analisys Tags tests
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config');
var ithelper = require('./itHelper');
var request = require('supertest');

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
var path = '/uoatags';
var pathClassType = '/uoaclasstypes';

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']);

describe('Subject`s tags (Unit of Analisys Tags):', function () {

    function allTests(user, token) {
        describe('All of tests for user: ' + user.firstName, function () {
            it('Select: correctly sets the X-Total-Count header ', function (done) {
                ithelper.checkHeaderValue(testEnv.api_created_realm, path, token, 200, 'X-Total-Count', 0, done);
            });
            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
            });

            if (user.roleID === 1) {
                it('CRUD: Create new UOA tag without creating classtype - impossible', function (done) {
                    var insertItem = {name: 'Test UOA tag'};
                    ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 400, obj, 'id', done);
                });
                it('CRUD: Create new UOA classtype', function (done) {
                    var insertItem = {name: 'Test UOA classtype'};
                    ithelper.insertOne(testEnv.api_created_realm, pathClassType, token, insertItem, 201, obj, 'classTypeId', done);
                });
                it('CRUD: Create new UOA tag after creating classtype', function (done) {
                    var insertItem = {name: 'Test UOA tag', classTypeId: obj.classTypeId};
                    ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'id', done);
                });
                it('CRUD: True number of records', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 1, done);
                });
                it('CRUD: Get created UOA tag', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, 'name', 'Test UOA tag', done);
                });
                it('CRUD: Update UOA tag', function (done) {
                    var updateItem = {name: 'Test UOA tag --- updated'};
                    ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, token, updateItem, 202, done);
                });
                it('CRUD: Get updated UOA tag', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, token, 200, null, 'name', 'Test UOA tag --- updated', done);
                });
                it('CRUD: Delete created/updated UOA tag', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, token, 204, done);
                });
                it('CRUD: True number of records after delete', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
                });
                it('CRUD: Delete created UOA classtype', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, pathClassType + '/' + obj.classTypeId, token, 204, done);
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
                    allTests(user, token);
                    done();
                });
        });

    }

    for (var i = 0; i < testEnv.allUsers.length; i++) {
        makeTests(testEnv.allUsers[i]);
    }

});
