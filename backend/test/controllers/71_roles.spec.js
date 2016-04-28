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
 //{name: 'roleSystem', isSystem: true}
 //];
 *
 * add to "config.testEntities.obj":
    //role: {
    //    testId,
    //    systemId
    //}
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
var testTitle = 'Roles: ';

describe(testTitle, function () {

    function userTests(user) {
        describe(testTitle+'All of tests for user ' + user.firstName, function () {
            it('Select true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, numberOfRecords, done);
            });

            it('Select initial content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, user.token, 200, rolesContent, done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle+'All of tests for admin ' + user.firstName, function () {
            it('CRUD: Create new Role - "testRole"', function (done) {
                var insertItem = {name: 'testRole'};
                ithelper.insertOne(testEnv.api_created_realm, path, user.token, insertItem, 201, obj, 'id', done);
                numberOfRecords++;
            });
            it('CRUD: Get created Role', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'testRole', done);
            });
            it('CRUD: Update Role', function (done) {
                var updateItem = {name: 'roleTest'};
                ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, updateItem, 202, done);
            });
            it('CRUD: Get updated Role', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'roleTest', done);
                rolesContent.push({name: 'roleTest', isSystem: false});
            });
            it('CRUD: True number of records after insert', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, numberOfRecords, done);
            });
            it('CRUD: Create new System Role - "roleSystem"', function (done) {
                var insertItem = {name: 'roleSystem', isSystem: true};
                ithelper.insertOne(testEnv.api_created_realm, path, user.token, insertItem, 201, obj, 'id1', done);
                rolesContent.push(insertItem);
                numberOfRecords++;
            });
            it('Select new content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path, user.token, 200, rolesContent, done);
            });
        });
    }

    userTests(config.testEntities.superAdmin);
    adminTests(config.testEntities.superAdmin);
    userTests(config.testEntities.admin);
    for (var i = 0; i < config.testEntities.users.length; i++) {
        userTests(config.testEntities.users[i]);
    }

});
