/**
 * Unit of Analisys Tag Links tests
 *
 * prerequsites tests: organizations, users, uoatypes, uoaclasstypes, uoatags, uoas
 *
 * used entities: organization, users
 *
 * created:
 *
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config/config');
var ithelper = require('./itHelper');
var request = require('supertest');
var _ = require('underscore');

var testEnv = {};
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.apiBase = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.apiBase + config.pgConnect.adminSchema + '/v0.2');
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var token;
var obj = {};
var path = '/uoataglinks';
var pathClassTypes = '/uoaclasstypes';
var pathTags = '/uoatags';
var pathUoas = '/uoas';
var testTitle = 'Subjects (Units of Analisys Tag links): ';

describe(testTitle, function () {

    /*
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
    */

    function userTests(user) {
        describe(testTitle + 'All of tests for user `' + user.firstName + '`', function () {
            it('Select: correctly sets the X-Total-Count header ', function (done) {
                ithelper.checkHeaderValue(testEnv.apiCreatedRealm, path, user.token, 200, 'X-Total-Count', 0, done);
            });
            it('Select: True number of records', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, 0, done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle + 'All of tests for admin `' + user.firstName + '`', function () {
            describe(testTitle + 'Errors creating uoa tag links', function () {
                it('Create new UOA tag links with wrong Tag - impossible', function (done) {
                    var insertItem = {
                        uoaId: 999,
                        uoaTagId: 999
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, user.token, insertItem, 400, 401, 'Not found tag with specified Id', done);
                });
            });
            describe(testTitle + 'Prepeare for following tests - 2 Class Types and 3 Tags  ', function () {
                it('Create new UOA classtype (1)', function (done) {
                    var insertItem = {
                        name: 'TestClasstype1'
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathClassTypes, user.token, insertItem, 201, obj, 'classTypeId1', done);
                });
                it('Create new UOA classtype (2)', function (done) {
                    var insertItem = {
                        name: 'TestClasstype2'
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathClassTypes, user.token, insertItem, 201, obj, 'classTypeId2', done);
                });
                it('Create new UOA tag (1) classtype (1)', function (done) {
                    var insertItem = {
                        name: 'TestTag1',
                        classTypeId: obj.classTypeId1
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathTags, user.token, insertItem, 201, obj, 'tagId1', done);
                });
                it('Create new UOA tag (2) classtype (1)', function (done) {
                    var insertItem = {
                        name: 'TestTag2',
                        classTypeId: obj.classTypeId1
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathTags, user.token, insertItem, 201, obj, 'tagId2', done);
                });
                it('Create new UOA tag (3) classtype (2)', function (done) {
                    var insertItem = {
                        name: 'TestTag3',
                        classTypeId: obj.classTypeId2
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathTags, user.token, insertItem, 201, obj, 'tagId3', done);
                });
            });
            describe(testTitle + 'Prepeare for following tests - UOA  ', function () {
                it('Create new UOA', function (done) {
                    var insertItem = {
                        name: 'UOA1',
                        unitOfAnalysisType: 1
                    }; // uoaType = default (1 Country)
                    ithelper.insertOne(testEnv.apiCreatedRealm, pathUoas, user.token, insertItem, 201, obj, 'uoaId', done);
                });
            });
            describe(testTitle + 'Main tests', function () {
                it('Create new UOA Tag link with Tag1 (classType1)', function (done) {
                    var insertItem = {
                        uoaId: obj.uoaId,
                        uoaTagId: obj.tagId1
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 201, obj, 'id1', done);
                });
                it('Create new UOA Tag link with Tag2 (classType1) - impossible create tag link with the same ClassType', function (done) {
                    var insertItem = {
                        uoaId: obj.uoaId,
                        uoaTagId: obj.tagId2
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, user.token, insertItem, 400, 401, 'Could not add tag with the same classification type', done);
                });
                it('Create new UOA Tag link with Tag3 (classType2)', function (done) {
                    var insertItem = {
                        uoaId: obj.uoaId,
                        uoaTagId: obj.tagId3
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 201, obj, 'id2', done);
                });
                it('Select UOA Tag links - true number of records', function (done) {
                    ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, 2, done);
                });
                it('Delete created UOA Tag link with Tag1 (classType1)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.id1, user.token, 204, done);
                });
                it('Delete created UOA Tag link with Tag3 (classType2)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.id2, user.token, 204, done);
                });
            });
            describe(testTitle + 'Delete all entities after tests completed', function () {
                it('Delete created UOA', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathUoas + '/' + obj.uoaId, user.token, 204, done);
                });
                it('CRUD: Delete UOA tag (1)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathTags + '/' + obj.tagId1, user.token, 204, done);
                });
                it('CRUD: Delete UOA tag (2)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathTags + '/' + obj.tagId2, user.token, 204, done);
                });
                it('CRUD: Delete UOA tag (3)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathTags + '/' + obj.tagId3, user.token, 204, done);
                });
                it('CRUD: Delete UOA classtype (1)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathClassTypes + '/' + obj.classTypeId1, user.token, 204, done);
                });
                it('CRUD: Delete UOA classtype (2)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, pathClassTypes + '/' + obj.classTypeId2, user.token, 204, done);
                });
            });
        });
    }

    it(testTitle + 'start', function (done) {
        allUsers = config.allUsers;
        userTests(ithelper.getUser(allUsers, 1));
        adminTests(ithelper.getUser(allUsers, 1));
        userTests(ithelper.getUser(allUsers, 2));
        adminTests(ithelper.getUser(allUsers, 2));
        for (var i = 0; i < config.testEntities.users.length; i++) {
            userTests(ithelper.getUser(allUsers, 3, i + 1));
        }
        done();
    });

});
