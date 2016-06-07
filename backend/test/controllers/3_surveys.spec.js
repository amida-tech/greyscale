/**
 * Surveys tests
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config');
var ithelper = require('./itHelper');
var request = require('supertest');
var co = require('co');
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

var allUsers  = [];
var token;
var obj ={};
var path = '/surveys';
var testTitle='Surveys: ';


var insertItem = {
    title: 'Test survey',
    description: 'Description of test survey',
    projectId: 2 // TODO get from user self
};
var updateItem = {
    title: insertItem.title + ' --- updated',
    description: insertItem.description + ' --- updated'
};

describe(testTitle, function () {

    before(function(done){
        // authorize users
        // allUsers.concat(config.testEntities.users);
        allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                tokenSuperAdmin = ithelper.getUser(allUsers,1).token;
                tokenAdmin = ithelper.getUser(allUsers,2).token;
                tokenUser1 = ithelper.getUser(allUsers,3,1).token;
                tokenUser2 = ithelper.getUser(allUsers,3,2).token;
                tokenUser3 = ithelper.getUser(allUsers,3,3).token;
                done();
            },
            (err) => done(err)
        );
    });

    function allTests() {

        describe(testTitle+'Prepare for test', function () {
/*
            it('Do prepare SQL script ', function (done) {
                ithelper.doSql('test/preDiscussions.sql', config.testEntities.organization.realm, done);
            });
*/
        });

        describe(testTitle+'Select before testing', function () {
            it('True number of records (superAdmin) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, tokenSuperAdmin, 200, 0, done);
            });
            it('True number of records (admin) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, tokenAdmin, 200, 0, done);
            });
            it('True number of records (user1) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, tokenUser1, 200, 0, done);
            });
        });

        describe(testTitle+'CRUD', function () {
            it('Create new survey', function (done) {
                ithelper.insertOne(testEnv.api_created_realm, path, tokenAdmin, insertItem, 201, insertItem, 'id', done);
            });
            it('True number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, tokenAdmin, 200, 1, done);
            });
            it('Get created survey', function (done) {
                ithelper.selectOneCheckField( testEnv.api_created_realm, path + '/' + insertItem.id, tokenAdmin, 200, null, 'title', insertItem.title, done);
            });
            it('Update survey', function (done) {
                ithelper.updateOne( testEnv.api_created_realm, path + '/' + insertItem.id, tokenAdmin, updateItem, 202, done
                );
            });
            it('Get updated survey', function (done) {
                ithelper.selectOneCheckFields(testEnv.api_created_realm, path + '/' + insertItem.id, tokenAdmin, 200, null, updateItem, done);
            });
            it('Delete created/updated survey', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/' + insertItem.id, tokenAdmin, 204, done);
            });
            it('True number of surveys after delete', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, tokenAdmin, 200, 0, done);
            });
        });

        describe(testTitle+'Clean up', function () {
/*
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postDiscussions.sql', config.testEntities.organization.realm, done);
            });
*/
        });


/*





            }
        });
*/
    }

    allTests();

});
