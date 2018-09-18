/**
 * Unit of Analisys Tags tests
 *
 * prerequsites tests: organizations, users, uoaclasstypes
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
var path = '/uoatags';
var pathClassType = '/uoaclasstypes';
var testTitle = 'Subject`s tags (Unit of Analisys Tags): ';

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
            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, 0, done);
            });
        });
    }

    function adminTests(user) {
        it('CRUD: Create new UOA tag without creating classtype - impossible', function (done) {
            var insertItem = {
                name: 'Test UOA tag'
            };
            ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 400, obj, 'id', done);
        });
        it('CRUD: Create new UOA classtype', function (done) {
            var insertItem = {
                name: 'Test UOA classtype'
            };
            ithelper.insertOne(testEnv.apiCreatedRealm, pathClassType, user.token, insertItem, 201, obj, 'classTypeId', done);
        });
        it('CRUD: Create new UOA tag after creating classtype', function (done) {
            var insertItem = {
                name: 'Test UOA tag',
                classTypeId: obj.classTypeId
            };
            ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 201, obj, 'id', done);
        });
        it('CRUD: True number of records', function (done) {
            ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, 1, done);
        });
        it('CRUD: Get created UOA tag', function (done) {
            ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA tag', done);
        });
        it('CRUD: Update UOA tag', function (done) {
            var updateItem = {
                name: 'Test UOA tag --- updated'
            };
            ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, updateItem, 202, done);
        });
        it('CRUD: Get updated UOA tag', function (done) {
            ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA tag --- updated', done);
        });
        it('CRUD: Delete created/updated UOA tag', function (done) {
            ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 204, done);
        });
        it('CRUD: True number of records after delete', function (done) {
            ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, 0, done);
        });
        it('CRUD: Delete created UOA classtype', function (done) {
            ithelper.deleteOne(testEnv.apiCreatedRealm, pathClassType + '/' + obj.classTypeId, user.token, 204, done);
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
