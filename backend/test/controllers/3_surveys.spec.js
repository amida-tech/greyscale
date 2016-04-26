/**
 * Unit of Analisys ClassTypes tests
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
var path = '/surveys';

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);

describe('Surveys:', function () {

    function allTests(user, token) {

        var insertItem = {
            title: 'Test survey',
            description: 'Description of test survey',
            projectId: 2 // TODO get from user self
        };

        describe('All of tests for user: ' + user.firstName, function () {

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
                //it('CRUD: Delete created/updated survey', function (done) {
                //    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, token, 204, done);
                //});
                //it('CRUD: True number of records after delete', function (done) {
                //    ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
                //});

            }
        });


        if (user.roleID === 1) {
            describe('Save test environment objects', function () {
                it('Save from surveys ***', function (done) {
                    obj.survey = insertItem;
                    config.testEntities.obj = _.extend({},obj);
                    console.log(config.testEntities.obj);
                    done();
                });
            });
        }
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
