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
testEnv.apiCreatedRealm = request.agent(testEnv.apiBase + testEnv.organization.realm + '/v0.2');

var allUsers = [];
var tokenSuperAdmin,
    tokenAdmin,
    tokenUser1,
    tokenUser2,
    tokenUser3;
var obj = {};

//INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId")
// VALUES (2, NULL, NULL, 66, 2, '2016-5-8 12:31:46.604', 2, '2016-5-8 00:00:00', '2016-5-8 00:00:00', 2, '{2}', NULL, NULL);

var productId = 2;
var uoaId = 66;
var user1Id = 3;
var user2Id = 4;
var user3Id = 5;
var step1Id = 2;
var step2Id = 3;
var step3Id = 4;

var insertItem = {
    uoaId : uoaId,
    stepId : step1Id,
    productId : productId,
    userId :user1Id
};
var updateItem = {};
var result = {};
var tasks =[];
var tasksForCheck = [];
var taskColumnsForCheck = [
    'userIds',
    'groupIds'
];

/*
var surveyQuestions4Check = _.each(surveyQuestions, function (item, i, array) {
    array[i] = _.omit(item, 'options');
});
*/

var path = '/tasks';
var testTitle = 'Tasks (issue 349): ';
var pathProducts = '/products/' + productId + '/tasks';
var level = function(l1, l2, l3) {
    if (l3) {
        return l1+'.'+l2+'.'+l3+' ';
    } else if (l2) {
        return l1+'.'+l2+' ';
    } else {
        return l1+' ';
    }
};
var l1= 0, l2= 0, l3=0;

describe(testTitle, function () {

    before(function (done) {
        allUsers = config.allUsers;
        tokenSuperAdmin = ithelper.getUser(allUsers, 1).token;
        tokenAdmin = ithelper.getUser(allUsers, 2).token;
        tokenUser1 = ithelper.getUser(allUsers, 3, 1).token;
        tokenUser2 = ithelper.getUser(allUsers, 3, 2).token;
        tokenUser3 = ithelper.getUser(allUsers, 3, 3).token;
        done();
    });

    function allTests() {

        describe(testTitle + 'Clean up', function () {
            it('Do clean up SQL script ', function (done) {
                ithelper.doSql('test/postTask349.sql', config.testEntities.organization.realm, done);
            });
        });
        describe(testTitle + 'Prepare for test', function () {
                        it('Do prepare SQL script ', function (done) {
                            ithelper.doSql('test/preTask349.sql', config.testEntities.organization.realm, done);
                        });
        });

        describe(level(++l1)+testTitle + ' /tasks  ', function () {
            it(level(l1, ++l2) + 'Assign scalar userId (post /tasks)', function (done) {
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, insertItem, 'id', done);
            });
            it(level(l1, ++l2) + 'Update scalar userId (put /tasks/:id)', function (done) {
                updateItem.userId = user2Id;
                ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, updateItem, 202, done);
            });
            it(level(l1, ++l2) + 'Check tasks content (get /tasks)', function (done) {
                updateItem.userIds = [updateItem.userId];
                tasksForCheck.push(_.pick(updateItem, taskColumnsForCheck));
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path, tokenAdmin, 200, tasksForCheck, done);
            });
            it(level(l1, ++l2) + '(Error) Add duplicate task (post /tasks)', function (done) {
                insertItem.userId = user3Id;
                ithelper.insertOneErrMessage(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 400, 403, 'Couldn`t add task with the same uoaId, stepId and productId', done);
            });
            it(level(l1, ++l2) + 'Delete task (delete /tasks/:id)', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 204, done);
            });
        });
        describe(level(++l1) + testTitle + ' put /products/:id/tasks  ', function () {
            l2=0;
            it(level(l1, ++l2) + 'Assign 2 new tasks', function (done) {
                tasks = [{
                    uoaId: uoaId,
                    stepId: step1Id,
                    productId: productId,
                    userIds: [
                        user1Id,
                        user2Id
                    ]
                },
                {
                    uoaId: uoaId,
                    stepId: step2Id,
                    productId: productId,
                    userIds: [
                        user3Id
                    ]

                }];
                ithelper.update(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 200, result, done);
            });
            it(level(l1, ++l2) + 'Check inserted', function (done) {
                var inserted = [{
                    userIds: [
                        user1Id,
                        user2Id
                    ]
                },
                {
                    userIds: [
                        user3Id
                    ]

                }];
                ithelper.checkArrObjArr(result.body.inserted, inserted,  done);
            });
            it(level(l1, ++l2) + 'Check updated', function (done) {
                var updated = [];
                ithelper.checkArrObjArr(result.body.updated, updated,  done);
            });
            it(level(l1, ++l2) + '(Error) Add duplicate task', function (done) {
                var taskDuplicate = {
                    uoaId: uoaId,
                    stepId: step1Id,
                    productId: productId,
                    userIds: [
                        user1Id,
                        user2Id
                    ]
                };
                tasks.push(taskDuplicate);
                ithelper.updateOneErrMessage(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 400, 403, 'Couldn`t add task with the same uoaId, stepId and productId', done);
            });
            it(level(l1, ++l2) + 'Delete task 1 (delete /tasks/:id)', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + result.body.inserted[0].id, tokenAdmin, 204, done);
            });
            it(level(l1, ++l2) + 'Delete task 2 (delete /tasks/:id)', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + result.body.inserted[1].id, tokenAdmin, 204, done);
            });
        });
        describe(level(++l1) + testTitle + ' assign groups  ', function () {
            l2=0;
            it(level(l1, ++l2) + 'Assign `All dummies` group', function (done) {
                tasks = [{
                    uoaId: uoaId,
                    stepId: step1Id,
                    productId: productId,
                    groupIds: [
                        3
                    ]
                }];
                ithelper.update(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 200, result, done);
            });
            it(level(l1, ++l2) + 'Assign `All dummies` group and several dummy users', function (done) {
                tasks[0].id = result.body.inserted[0].id;
                tasks[0].userIds = [11, 13, 15, 17, 19];
                ithelper.update(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 200, result, done);
            });
            it(level(l1, ++l2) + 'Check updated - no users in userIds', function (done) {
                var updated = [{
                    userIds: [],
                    groupIds: [3]
                }];
                ithelper.checkArrObjArr(result.body.updated, updated,  done);
            });
            it(level(l1, ++l2) + 'Assign `Dummy 1-4` & `Dummy 5-9` groups and  dummy users: 3, 4, 5, 6, 7', function (done) {
                tasks[0].userIds = [13, 14, 15, 16, 17];
                tasks[0].groupIds = [4, 5];
                ithelper.update(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 200, result, done);
            });
            it(level(l1, ++l2) + 'Check updated - no users in userIds', function (done) {
                var updated = [{
                    userIds: [],
                    groupIds: [4, 5]
                }];
                ithelper.checkArrObjArr(result.body.updated, updated,  done);
            });
            it(level(l1, ++l2) + 'Assign `Dummy 3-7` group and  dummy users: 1-9', function (done) {
                tasks[0].userIds = [11, 12, 13, 14, 15, 16, 17, 18, 19];
                tasks[0].groupIds = [6];
                ithelper.update(testEnv.apiCreatedRealm, pathProducts, tokenAdmin, tasks, 200, result, done);
            });
            it(level(l1, ++l2) + 'Check updated - only users 1, 2, 8, 9 in userIds', function (done) {
                var updated = [{
                    userIds: [11, 12, 18, 19],
                    groupIds: [6]
                }];
                ithelper.checkArrObjArr(result.body.updated, updated,  done);
            });
        });

        describe(testTitle + 'Clean up', function () {
            /*
             it('Do clean up SQL script ', function (done) {
             ithelper.doSql('test/postTask349.sql', config.testEntities.organization.realm, done);
             });
            */
        });

    }

    allTests();

});
