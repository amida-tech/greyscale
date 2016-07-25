/**
 * Tasks - issue 349 tests
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
testEnv.superAdmin = config.testEntities.superAdmin;
testEnv.admin = config.testEntities.admin;
testEnv.users = config.testEntities.users;
testEnv.organization = config.testEntities.organization;

testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.apiBase = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.apiBase + config.pgConnect.adminSchema + '/v0.2');
var apiCreatedRealm = testEnv.apiBase + testEnv.organization.realm + '/v0.2';
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + testEnv.organization.realm + '/v0.2');

var allUsers = [];
var tokenSuperAdmin,
    tokenAdmin,
    tokenUser1,
    tokenUser2,
    tokenUser3;
var auth = false;
var obj = {};


var productId = 3;
var uoaId = 66;
var adminId = 2;
var user1Id = 3;
var user2Id = 4;
var user3Id = 5;
var step1Id = 2;
var step2Id = 3;

var task6UserStatuses = [
    {userId: 2, status: 'flagged'},
    {userId: 13, status: 'flagged'},
    {userId: 14, status: 'pending'},
    {userId: 15, status: 'started'},
    {userId: 16, status: 'pending'},
    {userId: 17, status: 'pending'},
    {userId: 3, status: 'approved'},
    {userId: 4, status: 'started'},
    {userId: 5, status: 'pending'}
];
var task7UserStatuses = [
        {userId: 2, status: 'flagged'},
        {userId: 11, status: 'flagged'},
        {userId: 12, status: 'late'},
        {userId: 13, status: 'late'},
        {userId: 14, status: 'late'},
        {userId: 3, status: 'approved'},
        {userId: 4, status: 'late'},
        {userId: 5, status: 'late'}
];

var result = {};
var testTitle = 'Add userStatuses for tasks responces (issue 360): ';

describe(testTitle, function () {

    function checkExpStatus(expectedStatus, result, done) {
        expect(result.length,
            'user must have ' + expectedStatus.length + ' assigned tasks'
        ).to.equal(expectedStatus.length);
        _.each(result, function (item) {
            var expected = _.findWhere(expectedStatus, {taskId: item.id});
            expect(expected,
                'Not found taskId=' + item.id + ' from response in the expected values'
            ).to.not.be.undefined;
            expect(item.userStatus,
                'userStatus for taskId =' + expected.taskId + ' must be "' + expected.status +'"'
            ).to.equal(expected.status);
        });
        done();
    }

    function checkUserStatuses(expectedStatuses, result, done) {
        expect(result.length,
            'task must have ' + expectedStatuses.length + ' assigned users with statuses'
        ).to.equal(expectedStatuses.length);
        _.each(result, function (item) {
            var expected = _.findWhere(expectedStatuses, {userId: item.userId});
            expect(expected,
                'Not found userId=' + item.userId + ' from response in the expected values'
            ).to.not.be.undefined;
            expect(item.status,
                'status for userId =' + expected.userId + ' must be "' + expected.status +'"'
            ).to.equal(expected.status);
        });
        done();
    }

    function checkUserStatus(expectedStatus, result, done) {
        expect(result).to.not.be.undefined;
        expect(result.userStatus,
            'userStatus must be "' + expectedStatus +'"'
        ).to.equal(expectedStatus);
        done();
    }

    before(function (done) {
        allUsers = config.allUsers;
        if (allUsers && allUsers.length > 0) {
            tokenSuperAdmin = ithelper.getUser(allUsers, 1).token;
            tokenAdmin = ithelper.getUser(allUsers, 2).token;
            tokenUser1 = ithelper.getUser(allUsers, 3, 1).token;
            tokenUser2 = ithelper.getUser(allUsers, 3, 2).token;
            tokenUser3 = ithelper.getUser(allUsers, 3, 3).token;
            auth = true;
        }
        done();
    });

    function allTests() {

        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postTask360.sql', config.testEntities.organization.realm, done);
            });
        });
        describe(testTitle + 'Prepare for test', function () {
            it('Do prepare SQL script ', function (done) {
                ithelper.doSql('test/preTask360.sql', config.testEntities.organization.realm, done);
            });
        });

        describe(testTitle + 'Authorize (if needed)', function () {
            it('---', function (done) {
                if (auth) {
                    done();
                }
                // authorize users
                allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
                ithelper.getTokens(allUsers).then(
                    (res) => {
                        allUsers = res;
                        config.allUsers = _.extend({}, allUsers);
                        tokenSuperAdmin = ithelper.getUser(allUsers, 1).token;
                        tokenAdmin = ithelper.getUser(allUsers, 2).token;
                        tokenUser1 = ithelper.getUser(allUsers, 3, 1).token;
                        tokenUser2 = ithelper.getUser(allUsers, 3, 2).token;
                        tokenUser3 = ithelper.getUser(allUsers, 3, 3).token;
                        done();
                    },
                    (err) => done(err)
                );
            });
        });

        describe(testTitle + ' /users/self/tasks  ', function () {
            it('Get all tasks assigned to Admin', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/users/self/tasks'), tokenAdmin, {}, 200, result, done);
            });
            it('Check userStatus (Admin)', function (done) {
                checkExpStatus([
                    {taskId: 6, status: 'flagged'},
                    {taskId: 7, status: 'pending'}
                ], result.body, done);
            });
            it('Get all tasks assigned to User1', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/users/self/tasks'), tokenUser1, {}, 200, result, done);
            });
            it('Check userStatus (User1)', function (done) {
                checkExpStatus([
                    {taskId: 6, status: 'approved'},
                    {taskId: 7, status: 'pending'},
                    {taskId: 9},
                    {taskId: 10},
                    {taskId: 11}
                ], result.body, done);
            });
            it('Get all tasks assigned to User2', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/users/self/tasks'), tokenUser2, {}, 200, result, done);
            });
            it('Check userStatus (User2)', function (done) {
                checkExpStatus([
                    {taskId: 6, status: 'late'},
                    {taskId: 7, status: 'pending'}
                ], result.body, done);
            });
            it('Get all tasks assigned to User3', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/users/self/tasks'), tokenUser3, {}, 200, result, done);
            });
            it('Check userStatus (User3)', function (done) {
                checkExpStatus([
                    {taskId: 6, status: 'late'},
                    {taskId: 7, status: 'pending'}
                ], result.body, done);
            });
        });
        describe(testTitle + ' /tasks/6  ', function () {
            it('Get task.id=6 assigned to Admin', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/6'), tokenAdmin, {}, 200, result, done);
            });
            it('Check userStatus (Admin)', function (done) {
                checkUserStatus('flagged', result.body,  done);
            });
            it('Check userStatuses (Admin)', function (done) {
                checkUserStatuses(task6UserStatuses, result.body.userStatuses,  done);
            });
            it('Get task.id=6 assigned to User1', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/6'), tokenUser1, {}, 200, result, done);
            });
            it('Check userStatus (User1)', function (done) {
                checkUserStatus('approved', result.body,  done);
            });
            it('Check userStatuses (User1)', function (done) { // don't need - all statuses does not depend on the user - only on the task
                checkUserStatuses(task6UserStatuses, result.body.userStatuses,  done);
            });
            it('Get task.id=6 assigned to User2', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/6'), tokenUser2, {}, 200, result, done);
            });
            it('Check userStatus (User2)', function (done) {
                checkUserStatus('started', result.body,  done);
            });
            it('Get task.id=6 assigned to User3', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/6'), tokenUser3, {}, 200, result, done);
            });
            it('Check userStatus (User3)', function (done) {
                checkUserStatus('pending', result.body,  done);
            });
        });
        describe(testTitle + ' /tasks/7  ', function () {
            it('Get task.id=7 assigned to Admin', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/7'), tokenAdmin, {}, 200, result, done);
            });
            it('Check userStatus (Admin)', function (done) {
                checkUserStatus('flagged', result.body,  done);
            });
            it('Check userStatuses (Admin)', function (done) {
                checkUserStatuses(task7UserStatuses, result.body.userStatuses,  done);
            });
            it('Get task.id=7 assigned to User1', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/7'), tokenUser1, {}, 200, result, done);
            });
            it('Check userStatus (User1)', function (done) {
                checkUserStatus('approved', result.body,  done);
            });
            it('Check userStatuses (User1)', function (done) { // does not need - the same as for Admin
                checkUserStatuses(task7UserStatuses, result.body.userStatuses,  done);
            });
            it('Get task.id=7 assigned to User2', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/7'), tokenUser2, {}, 200, result, done);
            });
            it('Check userStatus (User2)', function (done) {
                checkUserStatus('late', result.body,  done);
            });
            it('Get task.id=7 assigned to User3', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/tasks/7'), tokenUser3, {}, 200, result, done);
            });
            it('Check userStatus (User3)', function (done) {
                checkUserStatus('late', result.body,  done);
            });
        });
        describe(testTitle + ' /products/3/tasks  ', function () {
            it('Get all tasks for product 3 assigned to Admin', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/products/3/tasks'), tokenAdmin, {}, 200, result, done);
            });
            it('Check userStatuses for task.id=6 (Admin)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 6});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task6UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Check userStatuses for task.id=7 (Admin)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 7});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task7UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Get all tasks for product 3 assigned to User1', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/products/3/tasks'), tokenUser1, {}, 200, result, done);
            });
            it('Check userStatuses for task.id=6 (User1)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 6});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task6UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Check userStatuses for task.id=7 (User1)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 7});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task7UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Get all tasks for product 3 assigned to User2', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/products/3/tasks'), tokenUser2, {}, 200, result, done);
            });
            it('Check userStatuses for task.id=6 (User2)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 6});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task6UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Check userStatuses for task.id=7 (User2)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 7});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task7UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Get all tasks for product 3 assigned to User3', function (done) {
                ithelper.anyRequest(testEnv.apiCreatedRealm.get('/products/3/tasks'), tokenUser3, {}, 200, result, done);
            });
            it('Check userStatuses for task.id=6 (User3)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 6});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task6UserStatuses, taskInfo.userStatuses,  done);
            });
            it('Check userStatuses for task.id=7 (User3)', function (done) {
                var taskInfo = _.findWhere(result.body, {id: 7});
                expect(taskInfo).to.not.be.undefined;
                checkUserStatuses(task7UserStatuses, taskInfo.userStatuses,  done);
            });
        });
    }

    allTests();

});
