/**
 * Unit of Analisys ClassTypes tests
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

var token;
var obj ={};
var path = '/surveys';


describe('Surveys:', function () {

    var allUsers  = [];

    before(function(done){
        // authorize users
        // allUsers.concat(config.testEntities.users);
        allUsers.push(config.testEntities.superAdmin);
        allUsers.push(config.testEntities.admin);
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                done();
            },
            (err) => done(err)
        );
    });

    it('Start tests',function(done){
        console.log(allUsers);
        for (var i in allUsers) {
            allTests(allUsers[i]);
        }
        done();
    })


    function allTests(user) {
        var token = user.token;
        var insertItem = {
            title: 'Test survey',
            description: 'Description of test survey',
            projectId: 2 // TODO get from user self
        };

        describe('All of tests for user: ' + [user.firstName, user.lastName].join(' '), function () {

            it('Select: true number of records', function (done) {
                ithelper.selectCount(
                    testEnv.api_created_realm,
                    path,
                    token,
                    200,
                    (user.roleID === 1) ? 0 : 1,
                    done
                );
            });

            if (user.roleID === 1) {

                it('CRUD: Create new survey', function (done) {
                    ithelper.insertOne(
                        testEnv.api_created_realm,
                        path,
                        token,
                        insertItem,
                        201,
                        insertItem,
                        'id',
                        done
                    );
                });

                it('CRUD: True number of records', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 1, done);
                });

                it('CRUD: Get created survey', function (done) {
                    ithelper.selectOneCheckField(
                        testEnv.api_created_realm,
                        path + '/' + insertItem.id,
                        token,
                        200,
                        null,
                        'title',
                        insertItem.title,
                        done
                    );
                });

                var updateItem = {
                    title: insertItem.title + ' --- updated',
                    description: insertItem.description + ' --- updated'
                };

                it('CRUD: Update survey', function (done) {
                    ithelper.updateOne(
                        testEnv.api_created_realm,
                        path + '/' + insertItem.id,
                        token,
                        updateItem,
                        202,
                        done
                    );
                });

                it('CRUD: Get updated survey', function (done) {
                    ithelper.selectOneCheckFields(
                        testEnv.api_created_realm,
                        path + '/' + insertItem.id,
                        token,
                        200,
                        null,
                        updateItem,
                        done
                    );
                });
                it('CRUD: Delete created/updated survey', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + insertItem.id, token, 204, done);
                });
                //it('CRUD: True number of records after delete', function (done) {
                //    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
                //});
            }
        });
    }
});
