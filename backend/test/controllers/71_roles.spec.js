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

testEnv.apiBase = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.apiBase + config.pgConnect.adminSchema + '/v0.2');
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + config.testEntities.organization.realm + '/v0.2');

var allUsers = {};
var token;
var obj = {};
var path = '/roles';
var rolesContent = [{
    id: 1,
    name: 'admin',
    isSystem: true
}, {
    id: 2,
    name: 'client',
    isSystem: true
}, {
    id: 3,
    name: 'user',
    isSystem: true
}];
var numberOfRecords = 3;
var testTitle = 'Roles: ';

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
            it('Select true number of records', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, numberOfRecords, done);
            });

            it('Select initial content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path, user.token, 200, rolesContent, done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle + 'All of tests for admin `' + user.firstName + '`', function () {
            it('CRUD: Create new Role - "testRole"', function (done) {
                var insertItem = {
                    name: 'testRole'
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 201, obj, 'id', done);
                numberOfRecords++;
            });
            it('CRUD: Get created Role', function (done) {
                ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 200, null, 'name', 'testRole', done);
            });
            it('CRUD: Update Role', function (done) {
                var updateItem = {
                    name: 'roleTest'
                };
                ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, updateItem, 202, done);
            });
            it('CRUD: Get updated Role', function (done) {
                ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 200, null, 'name', 'roleTest', done);
                rolesContent.push({
                    name: 'roleTest',
                    isSystem: false
                });
            });
            it('CRUD: True number of records after insert', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, user.token, 200, numberOfRecords, done);
            });
            it('CRUD: Create new System Role - "roleSystem"', function (done) {
                var insertItem = {
                    name: 'roleSystem',
                    isSystem: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, user.token, insertItem, 201, obj, 'id1', done);
                rolesContent.push(insertItem);
                numberOfRecords++;
            });
            it('Select new content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path, user.token, 200, rolesContent, done);
            });
            it('Delete system role', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.id1, user.token, 204, done);
                rolesContent.splice(-1, 1);
                numberOfRecords--;
            });
            it('Delete test role', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.id, user.token, 204, done);
                rolesContent.splice(-1, 1);
                numberOfRecords--;
            });
            it('Select content after deletions = initial content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path, user.token, 200, rolesContent, done);
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
