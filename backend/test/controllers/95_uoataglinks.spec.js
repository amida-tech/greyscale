/**
 * Unit of Analisys Tag Links tests
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
var path = '/uoataglinks';
var pathClassTypes = '/uoaclasstypes';
var pathTags = '/uoatags';
var pathUoas = '/uoas';

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']); // for debug only
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']); // for debug only

describe('Subjects (Units of Analisys Tag links):', function () {

    function allTests(user, token) {
        describe('All of tests for user: ' + user.firstName, function () {
            it('Select: correctly sets the X-Total-Count header ', function (done) {
                ithelper.checkHeaderValue(testEnv.api_created_realm, path, token, 200, 'X-Total-Count', 0, done);
            });
            it('Select: True number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
            });

            if (user.roleID === 1) {
                describe('Errors creating uoa tag links: ', function () {
                    it('Create new UOA tag links with wrong Tag - impossible', function (done) {
                        var insertItem = {uoaId: 1, uoaTagId: 1};
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, token, insertItem, 400, 401, 'Not found tag with specified Id', done);
                    });
                });
                describe('Prepeare for following tests - 2 Class Types and 3 Tags  ', function () {
                    it('Create new UOA classtype (1)', function (done) {
                        var insertItem = {name: 'TestClasstype1'};
                        ithelper.insertOne(testEnv.api_created_realm, pathClassTypes, token, insertItem, 201, obj, 'classTypeId1', done);
                    });
                    it('Create new UOA classtype (2)', function (done) {
                        var insertItem = {name: 'TestClasstype2'};
                        ithelper.insertOne(testEnv.api_created_realm, pathClassTypes, token, insertItem, 201, obj, 'classTypeId2', done);
                    });
                    it('Create new UOA tag (1) classtype (1)', function (done) {
                        var insertItem = {name: 'TestTag1', classTypeId: obj.classTypeId1};
                        ithelper.insertOne(testEnv.api_created_realm, pathTags, token, insertItem, 201, obj, 'tagId1', done);
                    });
                    it('Create new UOA tag (2) classtype (1)', function (done) {
                        var insertItem = {name: 'TestTag2', classTypeId: obj.classTypeId1};
                        ithelper.insertOne(testEnv.api_created_realm, pathTags, token, insertItem, 201, obj, 'tagId2', done);
                    });
                    it('Create new UOA tag (3) classtype (2)', function (done) {
                        var insertItem = {name: 'TestTag3', classTypeId: obj.classTypeId2};
                        ithelper.insertOne(testEnv.api_created_realm, pathTags, token, insertItem, 201, obj, 'tagId3', done);
                    });
                });
                describe('Prepeare for following tests - UOA  ', function () {
                    it('Create new UOA', function (done) {
                        var insertItem = {name: 'UOA1', unitOfAnalysisType: 1}; // uoaType = default (1 Country)
                        ithelper.insertOne(testEnv.api_created_realm, pathUoas, token, insertItem, 201, obj, 'uoaId', done);
                    });
                });
                describe('Main tests: ', function () {
                    it('Create new UOA Tag link with Tag1 (classType1)', function (done) {
                        var insertItem = {uoaId: obj.uoaId, uoaTagId: obj.tagId1};
                        ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'id1', done);
                    });
                    it('Create new UOA Tag link with Tag2 (classType1) - impossible create tag link with the same ClassType', function (done) {
                        var insertItem = {uoaId: obj.uoaId, uoaTagId: obj.tagId2};
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, token, insertItem, 400, 401, 'Could not add tag with the same classification type', done);
                    });
                    it('Create new UOA Tag link with Tag3 (classType2)', function (done) {
                        var insertItem = {uoaId: obj.uoaId, uoaTagId: obj.tagId3};
                        ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'id2', done);
                    });
                    it('Select UOA Tag links - true number of records', function (done) {
                        ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 2, done);
                    });
                    it('Delete created UOA Tag link with Tag1 (classType1)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id1, token, 204, done);
                    });
                    it('Delete created UOA Tag link with Tag3 (classType2)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id2, token, 204, done);
                    });
                });
                describe('Delete all entities after tests completed', function () {
                    it('Delete created UOA', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathUoas + '/' + obj.uoaId, token, 204, done);
                    });
                    it('CRUD: Delete UOA tag (1)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathTags + '/' + obj.tagId1, token, 204, done);
                    });
                    it('CRUD: Delete UOA tag (2)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathTags + '/' + obj.tagId2, token, 204, done);
                    });
                    it('CRUD: Delete UOA tag (3)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathTags + '/' + obj.tagId3, token, 204, done);
                    });
                    it('CRUD: Delete UOA classtype (1)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathClassTypes + '/' + obj.classTypeId1, token, 204, done);
                    });
                    it('CRUD: Delete UOA classtype (2)', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, pathClassTypes + '/' + obj.classTypeId1, token, 204, done);
                    });
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
