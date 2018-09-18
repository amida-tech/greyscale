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
var config = require('../../config/config');
var ithelper = require('./itHelper');
var request = require('supertest');
var _ = require('underscore');

var testEnv = {};
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.apiBase = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.apiBase + config.pgConnect.adminSchema + '/v0.2');
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var testTitle = 'Authorize users: ';

describe(testTitle, function () {

    it(testTitle + 'start', function (done) {
        // authorize users
        // allUsers.concat(config.testEntities.users);
        allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                config.allUsers = _.extend({}, allUsers);
                done();
            },
            (err) => done(err)
        );
    });
    it(testTitle + 'done', function (done) {
        done();
    });

});
