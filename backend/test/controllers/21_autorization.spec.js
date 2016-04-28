/**
 * Notifications tests
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
var async = require('async');
var _ = require('underscore');

var testEnv = {};
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.api_base          = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api               = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var testTitle='Authorize all users: ';

describe(testTitle, function () {

    function allTests() {
        describe('', function () {
            it('Save config.testEntities.allUsers with tokens', function (done) {
                config.testEntities = _.extend({},config.testEntities);
                //console.log('===========================================');
                //console.log(config.testEntities);
                done();
            });
        });
    }


    async.parallel([
            function(callback){
                it('Authorize superAdmin', function(done) {
                    var api = testEnv.api;
                    api
                        .get('/users/token')
                        .set('Authorization', 'Basic ' + new Buffer(config.testEntities.superAdmin.email + ':' + config.testEntities.superAdmin.password).toString('base64'))
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return err;
                            }
                            expect(res.body.token).to.exist;
                            config.testEntities.superAdmin.token = res.body.token;
                            done();
                            callback();
                        });
                });
            },
            function(callback){
                it('Authorize admin', function(done) {
                    var api = testEnv.api_created_realm;
                    api
                        .get('/users/token')
                        .set('Authorization', 'Basic ' + new Buffer(config.testEntities.admin.email + ':' + config.testEntities.admin.password).toString('base64'))
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return err;
                            }
                            expect(res.body.token).to.exist;
                            config.testEntities.admin.token = res.body.token;
                            done();
                            callback();
                        });
                });
            },
            function(callback){
                async.each(config.testEntities.users, function(user, doneUser){
                        // Authorize users and save token for later use
                        it('Authorize user ' + user.firstName, function(done) {
                            var api = testEnv.api_created_realm;
                            api
                                .get('/users/token')
                                .set('Authorization', 'Basic ' + new Buffer(user.email + ':' + user.password).toString('base64'))
                                .expect(200)
                                .end(function (err, res) {
                                    if (err) {
                                        return err;
                                    }
                                    expect(res.body.token).to.exist;
                                    user.token = res.body.token;
                                    done();
                                    doneUser();
                                });
                        });
                    }, function (err) {
                        callback();
                    }
                );
            }
        ],
        function(err, results){
            allTests();
        });
});
