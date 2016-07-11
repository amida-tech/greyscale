/**
 * Discussions tests
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

testEnv.apiBase = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.apiBase + config.pgConnect.adminSchema + '/v0.2');
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var tokenSuperAdmin;
var tokenAdmin;
var tokenUser1;
var tokenUser2;
var tokenUser3;

var token;
var obj = {};
var path = '/discussions';
var testTitle = 'Discussions: ';

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

var getUser4task2 = [{
    firstName: 'Anonymous',
    lastName: '',
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1',
    userIds: [3]
}, {
    firstName: 'User2',
    lastName: 'Test',
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2',
    userIds: [4]
}, {
    firstName: 'Anonymous',
    lastName: '',
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3',
    userIds: [5]
}, {
    firstName: 'Anonymous',
    lastName: '',
    role: 'Role 4',
    stepId: 5,
    stepName: 'Step 4',
    userIds: [2]
}];

var getUser4task1 = [{
    firstName: 'User1',
    lastName: 'Test',
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1',
    userIds: [3]
}, {
    firstName: 'User2',
    lastName: 'Test',
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2',
    userIds: [4]
}, {
    firstName: 'User3',
    lastName: 'Test',
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3',
    userIds: [5]
}, {
    firstName: 'Test',
    lastName: 'Admin',
    role: 'Role 4',
    stepId: 5,
    stepName: 'Step 4',
    userIds: [2]
}];

var getUser4survey = [{
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1'
}, {
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2'
}, {
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3'
}, {
    role: 'Role 4',
    stepId: 5,
    stepName: 'Step 4'
}];

var getUser4task1Anonymous = [{
    firstName: 'User1',
    lastName: 'Test',
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1',
    userIds: [3]
}, {
    firstName: 'User2',
    lastName: 'Test',
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2',
    userIds: [4]
}, {
    firstName: 'Anonymous',
    lastName: '',
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3',
    userIds: [5]
}, {
    firstName: 'Test',
    lastName: 'Admin',
    role: 'Role 4',
    stepId: 5,
    stepName: 'Step 4',
    userIds: [2]
}];

var getUser4task2ReturnList = [{
    firstName: 'Anonymous',
    lastName: '',
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1',
    userIds: [3]
}];

var getUser4task3ReturnList = [{
    role: 'Role 1',
    stepId: 2,
    stepName: 'Step1'
}, {
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2'
}];

var getUser4task1ResolveList = [{
    firstName: 'User3',
    lastName: 'Test',
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3',
    userIds: [5]
}];

var getUser4task1RLSeq = [{
    role: 'Role 2',
    stepId: 3,
    stepName: 'Step 2'
}];

var getUser4task2RLSeq = [{
    role: 'Role 3',
    stepId: 4,
    stepName: 'Step 3'
}];

var discussionsByCreated = [{
    entry: 'UPDATED simple discussion entry from Admin to Step2 (q1, t1)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)',
    activated: false
}, {
    entry: 'UPDATED Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)',
    activated: false
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)',
    activated: false
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - resolve Q1) Resolved automatically',
    activated: true
}, {
    entry: 'Discussion entry (flagged - resolve Q2) Resolved automatically',
    activated: true
}, {
    entry: 'Resolved automatically',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
    activated: false
}];

var discussionsByCreatedActual = [{
    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
    activated: false
}];

var discussionsByCreatedEnd = [{
    entry: 'UPDATED simple discussion entry from Admin to Step2 (q1, t1)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - resolve Q1) Resolved automatically',
    activated: true
}, {
    entry: 'Discussion entry (flagged - resolve Q2) Resolved automatically',
    activated: true
}, {
    entry: 'Resolved automatically',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step3->Step2 Discussion entry',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q3)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q2)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step2->Step3 Resolve (Q1)',
    activated: true
}];

var discussionsByCreatedDesc = [{
    entry: 'SEQUENTIAL FLAGGED Step2->Step3 Resolve (Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q2)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q3)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step3->Step2 Discussion entry',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Resolved automatically',
    activated: true
}, {
    entry: 'Discussion entry (flagged - resolve Q2) Resolved automatically',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - resolve Q1) Resolved automatically',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)',
    activated: true
}, {
    entry: 'UPDATED simple discussion entry from Admin to Step2 (q1, t1)',
    activated: true
}];

var discussionsByEntry = [{
    entry: 'Discussion entry (flagged - resolve Q2) Resolved automatically',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)',
    activated: true
}, {
    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
    activated: true
}, {
    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
    activated: true
}, {
    entry: 'Resolved automatically',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q2)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q3)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step2->Step3 Resolve (Q1)',
    activated: true
}, {
    entry: 'SEQUENTIAL FLAGGED Step3->Step2 Discussion entry',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - resolve Q1) Resolved automatically',
    activated: true
}, {
    entry: 'UPDATED Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)',
    activated: true
}, {
    entry: 'UPDATED simple discussion entry from Admin to Step2 (q1, t1)',
    activated: true
}];

describe(testTitle, function () {

    before(function (done) {
        // authorize users
        // allUsers.concat(config.testEntities.users);
        //allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        allUsers = config.allUsers;
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                tokenSuperAdmin = ithelper.getUser(allUsers, 1).token;
                tokenAdmin = ithelper.getUser(allUsers, 2).token;
                tokenUser1 = ithelper.getUser(allUsers, 3, 1).token;
                tokenUser2 = ithelper.getUser(allUsers, 3, 2).token;
                tokenUser3 = ithelper.getUser(allUsers, 3, 3).token;
                // correct user names
                getUser4task1ResolveList[0].firstName = ithelper.getUser(allUsers, 3, 3).firstName;
                getUser4task1ResolveList[0].lastName = ithelper.getUser(allUsers, 3, 3).lastName;

                getUser4task2[1].firstName = ithelper.getUser(allUsers, 3, 2).firstName;
                getUser4task2[1].lastName = ithelper.getUser(allUsers, 3, 2).lastName;

                getUser4task1[0].firstName = ithelper.getUser(allUsers, 3, 1).firstName;
                getUser4task1[0].lastName = ithelper.getUser(allUsers, 3, 1).lastName;
                getUser4task1[1].firstName = ithelper.getUser(allUsers, 3, 2).firstName;
                getUser4task1[1].lastName = ithelper.getUser(allUsers, 3, 2).lastName;
                getUser4task1[2].firstName = ithelper.getUser(allUsers, 3, 3).firstName;
                getUser4task1[2].lastName = ithelper.getUser(allUsers, 3, 3).lastName;
                getUser4task1[3].firstName = ithelper.getUser(allUsers, 2).firstName;
                getUser4task1[3].lastName = ithelper.getUser(allUsers, 2).lastName;

                getUser4task1Anonymous[0].firstName = ithelper.getUser(allUsers, 3, 1).firstName;
                getUser4task1Anonymous[0].lastName = ithelper.getUser(allUsers, 3, 1).lastName;
                getUser4task1Anonymous[1].firstName = ithelper.getUser(allUsers, 3, 2).firstName;
                getUser4task1Anonymous[1].lastName = ithelper.getUser(allUsers, 3, 2).lastName;
                getUser4task1Anonymous[3].firstName = ithelper.getUser(allUsers, 2).firstName;
                getUser4task1Anonymous[3].lastName = ithelper.getUser(allUsers, 2).lastName;

                done();
            },
            (err) => done(err)
        );
    });

    function allTests() {

        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postDiscussions.sql', config.testEntities.organization.realm, done);
            });
        });

        describe(testTitle + 'Prepare for test', function () {
            it('Do prepare SQL script ', function (done) {
                ithelper.doSql('test/preDiscussions.sql', config.testEntities.organization.realm, done);
            });
        });
        describe(testTitle + 'Select empty (before testing) ', function () {
            it('(Err) taskId must be specified', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path, tokenSuperAdmin, 400, 403, 'taskId must be specified', done);
            });
            it('(Err) taskId must be integer', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '?taskId=' + errTaskId, tokenSuperAdmin, 400, 403, 'taskId must be integer', done);
            });
            it('(Err) taskId does not exist', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '?taskId=' + notExistTaskId, tokenSuperAdmin, 400, 403, 'does not exist', done);
            });
            it('True number of records (superAdmin) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0], tokenSuperAdmin, 200, 0, done);
            });
            it('True number of records (admin) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0], tokenAdmin, 200, 0, done);
            });
            it('True number of records (user1) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0], tokenUser1, 200, 0, done);
            });
        });
        describe(testTitle + 'Add discussion`s entry (not flagged) ', function () {
            describe('Errors:', function () {
                it('(Err) questionId must be specified', function (done) {
                    var insertItem = {};
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'questionId must be specified', done);
                });
                it('(Err) questionId must be integer', function (done) {
                    var insertItem = {
                        questionId: errQuestionId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'questionId must be integer', done);
                });
                it('(Err) questionId does not exist', function (done) {
                    var insertItem = {
                        questionId: notExistQuestionId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                });
                it('(Err) taskId must be specified', function (done) {
                    var insertItem = {
                        questionId: questionId[0]
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'taskId must be specified', done);
                });
                it('(Err) taskId must be integer', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: errTaskId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'taskId must be integer', done);
                });
                it('(Err) taskId does not exist', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: notExistTaskId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                });
                it('(Err) stepId must be specified', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0]
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'stepId must be specified', done);
                });
                it('(Err) stepId must be integer', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: errStepId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'stepId must be integer', done);
                });
                it('(Err) userId does not exist', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: notExistStepId
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'does not exist', done);
                });
                it('(Err) discussion`s entry must be specified', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1]
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'Entry must be specified', done);
                });
            });
            describe('Success:', function () {
                it('Simple discussion entry from Admin to Step2 (q1, t1)', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'simple discussion entry from Admin to Step2 (q1, t1)'
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId1', done);
                });
                it('Get entry update for added entry', function (done) {
                    ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/entryscope/' + obj.discussionId1, tokenAdmin, 200, null, 'canUpdate', true, done);
                });
                it('Update simple discussion entry from Admin to Step2 (q1, t1)', function (done) {
                    var updateItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'UPDATED simple discussion entry from Admin to Step2 (q1, t1)'
                    };
                    ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + obj.discussionId1, tokenAdmin, updateItem, 202, done);
                });
                it('Simple discussion entry from User1 to Step2 (q1, t1)', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'simple discussion entry from User1 to Step2 (q1, t1)'
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId2', done);
                });
                it('Get entry update for added entry (next entry exist)', function (done) {
                    ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/entryscope/' + obj.discussionId1, tokenAdmin, 200, null, 'canUpdate', false, done);
                });
                it('(Err) Entry with id=<id> cannot be updated, there are have following entries', function (done) {
                    var updateItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'ERROR UPDATED Entry with id=<id> cannot be updated or deleted, there are have following entries'
                    };
                    ithelper.updateOneErrMessage(testEnv.apiCreatedRealm, path + '/' + obj.discussionId1, tokenAdmin, updateItem, 400, 403, 'Entry with id=.* cannot be updated or deleted, there are have following entries', done);
                });
                it('(Err) Entry with id=<id> cannot be deleted, there are have following entries', function (done) {
                    var updateItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'ERROR DELETED Entry with id=<id> cannot be updated or deleted, there are have following entries'
                    };
                    ithelper.deleteOneErrMessage(testEnv.apiCreatedRealm, path + '/' + obj.discussionId1, tokenAdmin, 400, 403, 'Entry with id=.* cannot be updated or deleted, there are have following entries', done);
                });
                it('True number of discussion`s entries = 2', function (done) {
                    ithelper.selectCount(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0], tokenUser1, 200, 2, done);
                });
                it('Delete created discussion entry (2)', function (done) {
                    ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + obj.discussionId2, tokenAdmin, 204, done);
                });
                it('True number of discussion`s entries = 1', function (done) {
                    ithelper.selectCount(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0], tokenUser1, 200, 1, done);
                });
            });
        });
        describe(testTitle + 'Errors when add discussion`s entry (flagged - return to previous step) ', function () {
            it('(Err) "It is not possible to post entry with "return" flag, because there are not previous steps"', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'Error - there are not previous steps',
                    isReturn: true
                };
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'It is not possible to post entry with .* flag, because there are not previous steps', done);
            });
        });
        describe('Survey next step:', function () {
            it('Move to the  next step', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId, tokenAdmin, 200, [], done);
            });
            it('Check current step', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[1]
                }], done);
            });
            it('get Entryscope for task2 (availList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2, 'availList', done);
            });
            it('get Entryscope for task2 (returnList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2ReturnList, 'returnList', done);
            });
        });
        describe(testTitle + 'Add discussion`s entry (flagged - return to previous step) ', function () {
            it('(Err) "It is not possible to post entry with "return" flag, because Task stepId=<id> does not equal currentStepId=<id>"', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'Error - invalid stepId',
                    isReturn: true
                };
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'It is not possible to post entry with "return" flag, because Task stepId=.* does not equal currentStepId=.*', done);
            });
            it('(Err) "Step with stepId=<id> does not available step for this survey`s discussion entry', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[1],
                    stepId: stepId[2],
                    entry: 'Error - not available step',
                    isReturn: true
                };
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'Step with stepId=.* does not available step for this survey`s discussion entry', done);
            });
            it('(Err) "No available steps for this survey`s discussion entry"', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[1],
                    stepId: stepId[2],
                    entry: 'Error - No available steps for this survey`s discussion entry',
                    isResolve: true
                };
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'No available steps for this survey`s discussion entry', done);
            });
            it('Check flagged task1 (flagged = true, count = 0)', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: false,
                    flaggedcount: '0',
                    flaggedfrom: null
                }, done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[1],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t2)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId31', done);
            });
            it('Check flagged task1 (flagged = true, count = 0) after 1 draft', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: false,
                    flaggedcount: '0',
                    flaggedfrom: null
                }, done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)', function (done) {
                var insertItem = {
                    questionId: questionId[1],
                    taskId: taskId[1],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId32', done);
            });
            it('Check flagged task1 (flagged = true, count = 0) after 2 draft', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: false,
                    flaggedcount: '0',
                    flaggedfrom: null
                }, done);
            });
            it('(Err) Entry with id=<id> cannot be updated, there are have following entries', function (done) {
                var updateItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'ERROR UPDATED Entry with id=<id> cannot be updated or deleted, there are have following entries'
                };
                ithelper.updateOneErrMessage(testEnv.apiCreatedRealm, path + '/' + obj.discussionId1, tokenAdmin, updateItem, 400, 403, 'Entry with id=.* cannot be updated or deleted, there are have following entries', done);
            });
            it('(Err) Entry with id=<id> cannot be deleted, there are have following entries', function (done) {
                var updateItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'ERROR DELETED Entry with id=<id> cannot be updated or deleted, there are have following entries'
                };
                ithelper.deleteOneErrMessage(testEnv.apiCreatedRealm, path + '/' + obj.discussionId1, tokenAdmin, 400, 403, 'Entry with id=.* cannot be updated or deleted, there are have following entries', done);
            });
            it('Update Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)', function (done) {
                var updateItem = {
                    questionId: questionId[1],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'UPDATED Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t2)'
                };
                ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + obj.discussionId32, tokenAdmin, updateItem, 202, done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)', function (done) {
                var insertItem = {
                    questionId: questionId[2],
                    taskId: taskId[1],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t2)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId33', done);
            });
            it('Check flagged task1 (flagged = true, count = 0) after 3 draft', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: false,
                    flaggedcount: '0',
                    flaggedfrom: null
                }, done);
            });
            it('Move to the  next step (force)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?force=true', tokenAdmin, 200, [], done);
            });
            it('Check current step', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[2]
                }], done);
            });
            it('Check flagged task1 (flagged = true, count = 0) new step', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: false,
                    flaggedcount: '0',
                    flaggedfrom: null
                }, done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[2],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId41', done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)', function (done) {
                var insertItem = {
                    questionId: questionId[1],
                    taskId: taskId[2],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q2, t3)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId42', done);
            });
            it('Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)', function (done) {
                var insertItem = {
                    questionId: questionId[2],
                    taskId: taskId[2],
                    stepId: stepId[0],
                    entry: 'Discussion entry (flagged - with return flag) from Admin to Step1 (q3, t3)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId43', done);
            });
            it('get Entryscope for task3 (returnList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[2], tokenAdmin, 200, getUser4task3ReturnList, 'returnList', done);
            });
            it('Move to the  next step (return flags exist)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId, tokenAdmin, 200, [], done);
            });
            it('Check current step', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[0]
                }], done);
            });
            it('Check flagged task1 (flagged = true, count = 3)', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: true,
                    flaggedcount: '3',
                    flaggedfrom: 4
                }, done);
            });
            it('get Entryscope for task1 (availList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1, 'availList', done);
            });
            it('get Entryscope for task1 (resolveList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
            });
            it('get Entryscope for task1 (returnList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, [], 'returnList', done);
            });
        });
        describe(testTitle + 'Add discussion`s entry (flagged - resolve) ', function () {
            it('(Err) "Step with stepId=<id> does not available step for this survey`s discussion entry"', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[1],
                    entry: 'Error - Step with stepId=<id> does not available step for this survey`s discussion entry',
                    isResolve: true
                };
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 400, 403, 'Step with stepId=.* does not available step for this survey`s discussion entry', done);
            });
            it('Discussion entry (flagged - resolve Q1)', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[2],
                    entry: 'Discussion entry (flagged - resolve Q1)',
                    isResolve: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId51', done);
            });
            it('get Entryscope for task1 (resolveList = step3)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
            });
            it('Check flagged task1 (flagged = true, count = 3) after 1 resolve', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, '/tasks/' + taskId[0], tokenAdmin, 200, null, {
                    flagged: true,
                    flaggedcount: '3',
                    flaggedfrom: 4
                }, done);
            });
            it('Discussion entry (flagged - resolve Q2)', function (done) {
                var insertItem = {
                    questionId: questionId[1],
                    taskId: taskId[0],
                    stepId: stepId[2],
                    entry: 'Discussion entry (flagged - resolve Q2)',
                    isResolve: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId52', done);
            });
            it('Update Discussion entry (flagged - resolve Q1)', function (done) {
                var updateItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[2],
                    entry: 'UPDATED Discussion entry (flagged - resolve Q1)'
                };
                ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + obj.discussionId51, tokenAdmin, updateItem, 202, done);
            });
            it('get Entryscope for task1 (resolveList = step3)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
            });
            it('Check current step (Step1) - resolve flag does not move workflow', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[0]
                }], done);
            });
            it('(Err) Resolve is not possible. Not all flags are resolved.', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?resolve=true', tokenAdmin, 400, 403, 'Resolve is not possible. Not all flags are resolved.', done);
            });
            /* do not add last (3rd) resolved entry - use force
                        it('Discussion entry (flagged - resolve Q3)', function (done) {
                            var insertItem = {questionId: questionId[2], taskId: taskId[0], stepId: stepId[2], entry: 'Discussion entry (flagged - resolve Q3)', isResolve: true};
                            ithelper.insertOne(testEnv.api_created_realm, path, tokenUser1, insertItem, 201, obj, 'discussionId53', done);
                        });
                        it('get Entryscope for task1 (resolveList = step3)', function (done) {
                            ithelper.selectCheckAllRecords4Key(testEnv.api_created_realm, path+'/entryscope?taskId='+taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
                        });
                        it('Resolve (move to resolve step)', function (done) {
                            ithelper.selectCheckAllRecords(testEnv.api_created_realm, '/products/'+productId+'/move/'+uoaId+'?resolve=true', tokenAdmin, 200, [], done);
                        });
            */
            it('Move to the  next step (force)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?force=true', tokenAdmin, 200, [], done);
            });
            it('Check current step (after resolve)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[2]
                }], done);
            });
            it('get Entryscope for task1 (resolveList is empty)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, [], 'resolveList', done);
            });
        });
        describe(testTitle + 'ONCE MORE Add discussion`s entry (flagged - return to previous step) ', function () {
            it('ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[2],
                    stepId: stepId[0],
                    entry: 'ONCE MORE Discussion entry (flagged - with return flag) from Admin to Step1 (q1, t3)',
                    isReturn: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId61', done);
            });
            it('Move to the  next step (return flags exist)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId, tokenAdmin, 200, [], done);
            });
            it('Check current step', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[0]
                }], done);
            });
            it('get Entryscope for task1 (availList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1, 'availList', done);
            });
            it('get Entryscope for task1 (resolveList)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
            });
        });
        describe(testTitle + 'ONCE MORE Add discussion`s entry (flagged - resolve) ', function () {
            it('ONCE MORE Discussion entry (flagged - resolve Q1)', function (done) {
                var insertItem = {
                    questionId: questionId[0],
                    taskId: taskId[0],
                    stepId: stepId[2],
                    entry: 'ONCE MORE Discussion entry (flagged - resolve Q1)',
                    isResolve: true
                };
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId51', done);
            });
            it('get Entryscope for task1 (resolveList = step3)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1ResolveList, 'resolveList', done);
            });
            it('Get all discussion`s entries (Order by "created")', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0] + '&order=created,updated', tokenAdmin, 200, discussionsByCreated, done);
            });
            it('Get actual messages (without history) discussion`s entries (Order by "created")', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0] + '&filter=resolve&order=created,updated', tokenAdmin, 200, discussionsByCreatedActual, done);
            });
            it('Resolve (move to resolve step)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?resolve=true', tokenAdmin, 200, [], done);
            });
            it('Check current step (after resolve)', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                    currentStepId: stepId[2]
                }], done);
            });
            it('get Entryscope for task1 (resolveList is empty)', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, [], 'resolveList', done);
            });
        });
        describe(testTitle + 'SEQUENTIAL FLAGGED', function () {
            describe(testTitle + 'SEQUENTIAL FLAGGED Step3->Step2', function () {
                it('Check current step', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                        currentStepId: stepId[2]
                    }], done);
                });
                it('SEQUENTIAL FLAGGED Step3->Step2 Discussion entry', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[2],
                        stepId: stepId[1],
                        entry: 'SEQUENTIAL FLAGGED Step3->Step2 Discussion entry',
                        isReturn: true
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, obj, 'discussionId71', done);
                });
                it('Move to the  next step (return flags exist)', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId, tokenAdmin, 200, [], done);
                });
                it('Check current step', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                        currentStepId: stepId[1]
                    }], done);
                });
                it('get Entryscope for task2 (availList)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4survey, 'availList', done);
                });
                it('get Entryscope for task2 (resolveList)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2RLSeq, 'resolveList', done);
                });
                it('(Err) SEQUENTIAL FLAGGED Step2->Step1 Discussion entry ".* entry for questionId=.* already exist"', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[1],
                        stepId: stepId[0],
                        entry: '(Err) SEQUENTIAL FLAGGED Step2->Step1 Discussion entry',
                        isReturn: true
                    };
                    ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, '.* entry for questionId=.* already exist', done);
                });
                it('Move to the  next step (return flags exist)', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId, tokenAdmin, 200, [], done);
                });
                it('Check current step', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                        currentStepId: stepId[0]
                    }], done);
                });
                it('get Entryscope for task1 (resolveList)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1RLSeq, 'resolveList', done);
                });
                it('SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q1)', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q1)',
                        isResolve: true
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId81', done);
                });
                it('get Entryscope for task1 (resolveList = step2)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1RLSeq, 'resolveList', done);
                });
                it('SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q3)', function (done) {
                    var insertItem = {
                        questionId: questionId[2],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q3)',
                        isResolve: true
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId83', done);
                });
                it('SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q2)', function (done) {
                    var insertItem = {
                        questionId: questionId[1],
                        taskId: taskId[0],
                        stepId: stepId[1],
                        entry: 'SEQUENTIAL FLAGGED Step1->Step2 Resolve (Q2)',
                        isResolve: true
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId82', done);
                });
                it('get Entryscope for task1 (resolveList = step2)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1RLSeq, 'resolveList', done);
                });
                it('Resolve (move to resolve step - step2)', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?resolve=true', tokenAdmin, 200, [], done);
                });
                it('Check current step (after resolve) -> step2', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                        currentStepId: stepId[1]
                    }], done);
                });
                it('get Entryscope for task2 (resolveList = step3)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2RLSeq, 'resolveList', done);
                });
                it('SEQUENTIAL FLAGGED Step2->Step3 Resolve (Q1)', function (done) {
                    var insertItem = {
                        questionId: questionId[0],
                        taskId: taskId[1],
                        stepId: stepId[2],
                        entry: 'SEQUENTIAL FLAGGED Step2->Step3 Resolve (Q1)',
                        isResolve: true
                    };
                    ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenUser1, insertItem, 201, obj, 'discussionId91', done);
                });
                it('get Entryscope for task2 (resolveList = step3)', function (done) {
                    ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2RLSeq, 'resolveList', done);
                });
                it('Resolve (move to resolve step - step3)', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/move/' + uoaId + '?resolve=true', tokenAdmin, 200, [], done);
                });
                it('Check current step (after resolve) -> step3', function (done) {
                    ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, '/products/' + productId + '/uoa', tokenAdmin, 200, [{
                        currentStepId: stepId[2]
                    }], done);
                });
            });
        });
        describe(testTitle + 'get Users ', function () {
            it('(Err) taskId must be integer', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '/users/' + errTaskId, tokenSuperAdmin, 400, 403, 'taskId must be integer', done);
            });
            it('(Err) taskId does not exist', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '/users/' + notExistTaskId, tokenSuperAdmin, 400, 403, 'does not exist', done);
            });
            it('for task2 with blindReview flag', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/users/' + taskId[1], tokenAdmin, 200, getUser4task2, done);
            });
            it('for task1 without blindReview flag - Admin request', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/users/' + taskId[0], tokenAdmin, 200, getUser4task1, done);
            });
            it('for task1 without blindReview flag - User1 request', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/users/' + taskId[0], tokenUser1, 200, getUser4task1, done);
            });
            it('Update User3 as Anonymous', function (done) {
                ithelper.updateOne(testEnv.apiCreatedRealm, '/users/self', tokenUser3, {
                    isAnonymous: true
                }, 202, done);
            });
            it('for task1 without blindReview flag - User3=Anonymous, Admin request', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/users/' + taskId[0], tokenAdmin, 200, getUser4task1, done);
            });
            it('for task1 without blindReview flag - User3=Anonymous, User1 request', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/users/' + taskId[0], tokenUser1, 200, getUser4task1Anonymous, done);
            });
            it('Clear Anonymous flag for User3', function (done) {
                ithelper.updateOne(testEnv.apiCreatedRealm, '/users/self', tokenUser3, {
                    isAnonymous: false
                }, 202, done);
            });
        });
        describe(testTitle + 'get Entryscope ', function () {
            it('(Err) taskId must be specified', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '/entryscope', tokenAdmin, 400, 403, 'taskId must be specified', done);
            });
            it('(Err) taskId must be integer', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + errTaskId, tokenAdmin, 400, 403, 'taskId must be integer', done);
            });
            it('(Err) taskId does not exist', function (done) {
                ithelper.selectErrMessage(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + notExistTaskId, tokenAdmin, 400, 403, 'does not exist', done);
            });
            it('for task1', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[0], tokenAdmin, 200, getUser4task1, 'availList', done);
            });
            it('for task2', function (done) {
                ithelper.selectCheckAllRecords4Key(testEnv.apiCreatedRealm, path + '/entryscope?taskId=' + taskId[1], tokenAdmin, 200, getUser4task2, 'availList', done);
            });
        });
        describe(testTitle + 'sorting ', function () {
            it('Order by "created"', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0] + '&order=created,updated', tokenAdmin, 200, discussionsByCreatedEnd, done);
            });
            it('Order by "created" descending', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0] + '&order=-created', tokenAdmin, 200, discussionsByCreatedDesc, done);
            });
            it('Order by "entry"', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '?taskId=' + taskId[0] + '&order=entry', tokenAdmin, 200, discussionsByEntry, done);
            });
        });
        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postDiscussions.sql', config.testEntities.organization.realm, done);
            });
        });
    }

    allTests();

});
