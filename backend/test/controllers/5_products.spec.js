/**
 * Unit of Analisys ClassTypes tests
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config');
var Products = require('../../app/models/products');
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
var path = '/products';

// make all users list
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);

describe('Products:', function () {

    function allTests(user, token) {

        var insertItem = {
            title: 'Test product',
            description: 'Description of test product',
            projectId: 2,  // todo get from user self
            surveyId: obj.survey.id,
            status: Products.statuses[0]
        };

        describe('All of tests for user: ' + user.firstName, function () {
            //it('Select: correctly sets the X-Total-Count header ', function (done) {
            //    ithelper.checkHeaderValue(testEnv.api_created_realm, path, token, 200, 'X-Total-Count', 0, done);
            //});


            it('Select: true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 0, done);
            });

            if (user.roleID === 1) {
                it('CRUD: Create new product', function (done) {

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

                it('CRUD: Get created product', function (done) {
                    ithelper.selectOneCheckFields(
                        testEnv.api_created_realm,
                        path + '/' + insertItem.id,
                        token,
                        200,
                        null,
                        insertItem,
                        done
                    );
                });

                //it('CRUD: Update product', function (done) {
                //    var updateItem = {name: 'Test product --- updated'};
                //    ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, token, updateItem, 202, done);
                //});

                //it('CRUD: Get updated product', function (done) {
                //    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.id, token, 200, 'name', 'Test UOA classtype --- updated', done);
                //});

                //it('CRUD: Delete created/updated product', function (done) {
                //    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, token, 204, done);
                //});

                //it('CRUD: True number of records after delete', function (done) {
                //    ithelper.select(testEnv.api_created_realm, path, token, 200, 0, done);
                //});
            }
        });

        if (user.roleID === 1) {
            describe('Save test environment objects', function () {
                it('Save from products ***', function (done) {
                    obj.product = insertItem;
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

                    describe('Get test environment objects', function () {
                        it('Get to products ***', function (done) {
                            if (_.isEmpty(obj)){
                                obj = _.extend({},config.testEntities.obj);


                            }
                            done();
                        });
                    });

                    describe('Tests', function () {
                        it('Make tests for users', function (done) {
                            allTests(user, token);
                            done();
                        });
                    });
                    done();
                });
        });

    }

    for (var i = 0; i < testEnv.allUsers.length; i++) {
        makeTests(testEnv.allUsers[i]);
    }

});
