/**
 * Unit of Analisys Types tests
 *
 * prerequsites tests: organizations, users
 *
 * used entities: organization, users, uoatype (Country) - initial sceleton
 *
 * created:
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

testEnv.api_base          = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api               = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var allUsers  = [];
var token;
var obj ={};
var path = '/uoatypes';
var testTitle = 'Subject`s types (Unit of Analisys types): ';

describe(testTitle, function () {

    before(function(done){
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
        describe(testTitle+'All of tests for user `' + user.firstName+'`', function () {
            it('Select: correctly sets the X-Total-Count header ', function (done) {
                ithelper.checkHeaderValue(testEnv.api_created_realm, path, user.token, 200, 'X-Total-Count', 1, done);
            });
            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, 1, done);
            });

            it('Select: Country record is true', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path+'/1', user.token, 200, null, 'name', 'Country', done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle+'All of tests for admin `' + user.firstName+'`', function () {
            it('CRUD: Create new UOA type', function (done) {
                var insertItem = {name: 'Test UOA type'};
                ithelper.insertOne(testEnv.api_created_realm, path, user.token, insertItem, 201, obj, 'id', done);
            });
            it('CRUD: Get created UOA type', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA type', done);
            });
            it('CRUD: Update UOA type', function (done) {
                var updateItem = {name: 'Test UOA type --- updated'};
                ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, updateItem, 202, done);
            });
            it('CRUD: Get updated UOA type', function (done) {
                ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, 'name', 'Test UOA type --- updated', done);
            });
            it('CRUD: Delete created/updated UOA type', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, 204, done);
            });
            it('CRUD: True number of records after delete', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, 1, done);
            });
        });
    }

    it(testTitle+'start',function(done){
        userTests(ithelper.getUser(allUsers,1));
        adminTests(ithelper.getUser(allUsers,1));
        userTests(ithelper.getUser(allUsers,2));
        adminTests(ithelper.getUser(allUsers,2));
        for (var i = 0; i < config.testEntities.users.length; i++) {
            userTests(ithelper.getUser(allUsers,3,i+1));
        }
        done();
    });

});
