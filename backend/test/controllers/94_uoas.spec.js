/**
 * Unit of Analisys tests
 *
 * prerequsites tests: organizations, users, uoatypes
 *
 * used entities: organization, users, uoatype (Country)
 *
 * created: UOA with name 'Test Subject' type 'Country'
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
var path = '/uoas';
var numberOfRecords = 0;
var testTitle = 'Subjects (Units of Analisys): ';

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']);

describe(testTitle, function () {

    function allTests(user, token) {
        describe(testTitle+'All of tests for user: ' + user.firstName, function () {
            it('Select: correctly sets the X-Total-Count header ', function (done) {
                numberOfRecords = (user.roleID === 1) ? 0 : 1;
                ithelper.checkHeaderValue(testEnv.api_created_realm, path, token, 200, 'X-Total-Count', numberOfRecords, done);
            });
            it('Select: True number of records', function (done) {
                numberOfRecords = (user.roleID === 1) ? 0 : 1;
                ithelper.selectCount(testEnv.api_created_realm, path, token, 200, numberOfRecords, done);
            });

            if (user.roleID === 1) {
                describe('Errors creating uoas: ', function () {
                    /*
                     {
                     "!": 0,
                     "e": "23502",
                     "message": "нулевое значение в колонке \"unitOfAnalysisType\" нарушает ограничение NOT NULL"
                     }
                     */
                    it('Create new UOA tag without specifing `Type` - impossible', function (done) {
                        var insertItem = {name: 'Test UOA'};
                        ithelper.insertOneErr(testEnv.api_created_realm, path, token, insertItem, 400, '23502', done);
                    });
                    it('Create new UOA tag without specifing `Name` - impossible', function (done) {
                        var insertItem = {unitOfAnalysisType: 1};
                        ithelper.insertOneErr(testEnv.api_created_realm, path, token, insertItem, 400, '23502', done);
                    });
                });
                describe('CRUD: ', function () {
                    it('Create new UOA', function (done) {
                        var insertItem = {name: 'Test Subject New', unitOfAnalysisType: 1};
                        ithelper.insertOne(testEnv.api_created_realm, path, token, insertItem, 201, obj, 'uoaId', done);
                    });
                    it('True number of records', function (done) {
                        ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 1, done);
                    });
                    it('Create not unique UOA -impossible', function (done) {
                        //"e": "23502",
                        //повторяющееся значение ключа нарушает ограничение уникальности "UnitOfAnalysis_name_key"
                        var insertItem = {name: 'Test Subject New', unitOfAnalysisType: 1};
                        ithelper.insertOneErr(testEnv.api_created_realm, path, token, insertItem, 400, '23505', done);
                    });
                    it('Get created UOA', function (done) {
                        ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.uoaId, token, 200, null, 'name', 'Test Subject New', done);
                    });
                    it('Update UOA', function (done) {
                        var updateItem = {name: 'Test Subject'};
                        ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.uoaId, token, updateItem, 202, done);
                    });
                    it('Get updated UOA', function (done) {
                        ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/' + obj.uoaId, token, 200, null, 'name', 'Test Subject', done);
                    });
/*
                    it('Delete created/updated UOA', function (done) {
                        ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.uoaId, token, 204, done);
                    });
*/
                    it('True number of records after test is completed', function (done) {
                        ithelper.selectCount(testEnv.api_created_realm, path, token, 200, 1, done);
                    });
                    describe('', function () {
                        it('Save test environment objects from uoas -> obj.uoa.testId (new "Test Subject" Id)', function (done) {
                            obj = _.extend(obj,{
                                uoa: {
                                    testId: obj.uoaId
                                }
                            });
                            config.testEntities.obj = _.extend({},obj);
                            //console.log(config.testEntities.obj);
                            done();
                        });
                    });
                });
            }
        });
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
                    describe('', function () {
                        it('Get test environment objects to uoas <- config.testEntities.obj', function (done) {
                            if (_.isEmpty(obj)){
                                obj = _.extend({},config.testEntities.obj);
                                //console.log(obj);
                            }
                            done();
                        });
                    });
                    allTests(user, token);
                    done();
                });
        });

    }

    for (var i = 0; i < testEnv.allUsers.length; i++) {
        makeTests(testEnv.allUsers[i]);
    }

});
