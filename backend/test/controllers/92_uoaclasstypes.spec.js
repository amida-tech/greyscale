/**
 * Unit of Analisys ClassTypes tests
 *
 * prerequsites tests: organizations, users
 *
 * used entities: organization, users
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
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.api_base = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var token;
var obj = {};
var path = '/uoaclasstypes';
var testTitle = 'Subject`s classtypes (Unit of Analisys classtypes): ';

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
                ithelper.checkHeaderValue(testEnv.api_created_realm, path, user.token, 200, 'X-Total-Count', 0, done);
            });
            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, 0, done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle + 'All of tests for admin `' + user.firstName + '`', function () {
            it('CRUD: Create new UOA classtype', function (done) {
                var insertItem = {
                    name: 'Test UOA classtype'
                };
                ithelper.insertOne(testEnv.api_created_realm, path, user.token, insertItem, 201, obj, 'id', done);
            });
            it('CRUD: True number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, 1, done);
            });
            it('CRUD: Get created UOA classtype', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA classtype', done);
            });
            it('CRUD: Update UOA type', function (done) {
                var updateItem = {
                    name: 'Test UOA classtype --- updated'
                };
                ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, updateItem, 202, done);
            });
            it('CRUD: Get updated UOA classtype', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA classtype --- updated', done);
            });
            it('CRUD: Delete created/updated UOA classtype', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, 204, done);
            });
            it('CRUD: True number of records after delete', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, 0, done);
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
