/**
 * Comments tests
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

testEnv.api_base = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var tokenSuperAdmin;
var tokenAdmin;
var tokenUser1;
var tokenUser2;
var tokenUser3;

var token;
var obj = {};
var path = '/comments';
var testTitle = 'Comments: ';

// entities for tests
var errTaskId = 'abc';
var notExistTaskId = 9999;
var taskId = [2, 3, 4, 5];
var errQuestionId = 'abc';
var notExistQuestionId = 9999;
var questionId = [2, 3, 4];

var errStepId = 'abc';
var notExistStepId = 9999;
var stepId = [2, 3, 4, 5];
var userId = [3, 4, 5];
var adminId = 2;

var productId = 2;
var uoaId = 66;

var insertItem, insertItem2, updateItem, updateItem4Check;
var getUsers4Task1_comments = {
    users: [{
        userId: 2,
        firstName: 'Admin',
        lastName: 'Test',
        email: 'test-adm@mail.net'
    }, {
        userId: 3,
        firstName: 'User1',
        lastName: 'Test',
        email: 'user1@mail.net'
    }, {
        userId: 5,
        firstName: 'User3',
        lastName: 'Test',
        email: 'user3@mail.net'
    }],
    groups: [{
        groupId: 2,
        title: 'Admin&User1'
    }, {
        groupId: 4,
        title: 'User1&User3'
    }]
};
var doErrorTests = false;

describe(testTitle, function () {

    before(function (done) {
        // authorize users
        // allUsers.concat(config.testEntities.users);
        //allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        allUsers = config.allUsers;
        //ithelper.getTokens(allUsers).then(
        //    (res) => {
        //        allUsers = res;
        tokenSuperAdmin = ithelper.getUser(allUsers, 1).token;
        tokenAdmin = ithelper.getUser(allUsers, 2).token;
        tokenUser1 = ithelper.getUser(allUsers, 3, 1).token;
        tokenUser2 = ithelper.getUser(allUsers, 3, 2).token;
        tokenUser3 = ithelper.getUser(allUsers, 3, 3).token;
        done();
        //    },
        //    (err) => done(err)
        //);
    });

    function allTests() {

        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postComments.sql', config.testEntities.organization.realm, done);
            });
        });

        describe(testTitle + 'Prepare for test', function () {
            it('Do prepare SQL script ', function (done) {
                ithelper.doSql('test/preComments.sql', config.testEntities.organization.realm, done);
            });
        });
        describe(testTitle + 'Select empty (before testing) ', function () {
            if (doErrorTests) {
                it('(Err) taskId must be specified', function (done) {
                    ithelper.selectErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, 400, 403, 'taskId must be specified', done);
                });
                it('(Err) taskId must be integer', function (done) {
                    ithelper.selectErrMessage(testEnv.api_created_realm, path + '?taskId=' + errTaskId, tokenSuperAdmin, 400, 403, 'taskId must be integer', done);
                });
                it('(Err) taskId does not exist', function (done) {
                    ithelper.selectErrMessage(testEnv.api_created_realm, path + '?taskId=' + notExistTaskId, tokenSuperAdmin, 400, 403, 'does not exist', done);
                });
            }
            it('True number of records (superAdmin) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[0], tokenSuperAdmin, 200, 0, done);
            });
            it('True number of records (admin) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[0], tokenAdmin, 200, 0, done);
            });
            it('True number of records (user1) = 0', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[0], tokenUser1, 200, 0, done);
            });
        });
        describe(testTitle + 'Add comment (not flagged) ', function () {
            if (doErrorTests) {
                describe('Errors:', function () {
                    it('(Err) questionId must be specified', function (done) {
                        insertItem = {};
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'questionId must be specified', done);
                    });
                    it('(Err) questionId must be integer', function (done) {
                        insertItem = {
                            questionId: errQuestionId
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'questionId must be integer', done);
                    });
                    it('(Err) questionId does not exist', function (done) {
                        insertItem = {
                            questionId: notExistQuestionId
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                    });
                    it('(Err) taskId must be specified', function (done) {
                        insertItem = {
                            questionId: questionId[0]
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'taskId must be specified', done);
                    });
                    it('(Err) taskId must be integer', function (done) {
                        insertItem = {
                            questionId: questionId[0],
                            taskId: errTaskId
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'taskId must be integer', done);
                    });
                    it('(Err) taskId does not exist', function (done) {
                        insertItem = {
                            questionId: questionId[0],
                            taskId: notExistTaskId
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                    });
                    it('(Err) userId does not exist', function (done) {
                        insertItem = {
                            questionId: questionId[0],
                            taskId: taskId[0],
                            stepId: notExistStepId
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                    });
                    it('(Err) discussion`s entry must be specified', function (done) {
                        insertItem = {
                            questionId: questionId[0],
                            taskId: taskId[0],
                            stepId: stepId[1]
                        };
                        ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenAdmin, insertItem, 400, 403, 'Entry must be specified', done);
                    });
                });
            }
            describe('Success:', function () {
                it('Simple comment from User1 (Step1, Question1)', function (done) {
                    insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[0],
                        entry: 'Simple comment from User1 (Step1, Question1)'
                    };
                    ithelper.insertOne(testEnv.api_created_realm, path, tokenUser1, insertItem, 201, insertItem, 'id', done);
                });
                it('Get entry update for added entry (User1 - true)', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/entryscope/' + insertItem.id, tokenUser1, 200, null, 'canUpdate', true, done);
                });
                it('Get entry update for added entry (User2 - false)', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/entryscope/' + insertItem.id, tokenUser2, 200, null, 'canUpdate', false, done);
                });
                it('Get entry update for added entry (Admin - true)', function (done) {
                    ithelper.selectOneCheckField(testEnv.api_created_realm, path + '/entryscope/' + insertItem.id, tokenAdmin, 200, null, 'canUpdate', true, done);
                });
                it('Update Simple comment from Admin (Step1, Question1)', function (done) {
                    updateItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[0],
                        entry: 'UPDATED ' + insertItem.entry,
                        tags: {
                            users: [2, 3, 4, 5],
                            groups: [2, 3, 4]
                        },
                        range: {
                            start: 2,
                            end: 7
                        }
                    };
                    ithelper.updateOne(testEnv.api_created_realm, path + '/' + insertItem.id, tokenAdmin, updateItem, 202, done);
                });
                it('Get comments content', function (done) {
                    updateItem4Check = _.extend(updateItem, {
                        tags: JSON.stringify(updateItem.tags),
                        range: JSON.stringify(updateItem.range)
                    });
                    ithelper.selectCheckAllRecords(testEnv.api_created_realm, path + '?taskId=' + taskId[0] + '&order=created', tokenAdmin, 200, [updateItem4Check], done);
                });
                it('Simple comment from User1 (Step1, Question2)', function (done) {
                    insertItem2 = {
                        questionId: questionId[1],
                        taskId: taskId[0],
                        stepId: stepId[0],
                        entry: 'Simple comment from User1 (Step1, Question2)'
                    };
                    ithelper.insertOne(testEnv.api_created_realm, path, tokenUser1, insertItem2, 201, insertItem2, 'id', done);
                });
                it('(Err) Delete created comment (User2 couldn`t delete comment)', function (done) {
                    ithelper.deleteOneErrMessage(testEnv.api_created_realm, path + '/' + insertItem2.id, tokenUser2, 400, 403, 'Comment with id=.* cannot be updated or deleted', done);
                });
                it('True number of discussion`s entries = 2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[0], tokenUser1, 200, 2, done);
                });
                it('Delete created comment (Admin has rights to delete)', function (done) {
                    ithelper.deleteOne(testEnv.api_created_realm, path + '/' + insertItem2.id, tokenAdmin, 204, done);
                });
                it('True number of discussion`s entries = 1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[0], tokenUser1, 200, 1, done);
                });
                it('True number of discussion`s entries for task2 = 0', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path + '?taskId=' + taskId[1], tokenUser1, 200, 0, done);
                });
            });
        });
        describe(testTitle + 'get Users ', function () {
            it('for task1 without blindReview flag - Admin request', function (done) {
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path + '/users/' + taskId[0], tokenAdmin, 200, getUsers4Task1_comments, done);
            });
        });
        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postComments.sql', config.testEntities.organization.realm, done);
            });
        });
    }

    allTests();

});
