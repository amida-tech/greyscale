/**
 * Notifications tests
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config');
var ithelper = require('./itHelper');
var request = require('supertest');
var async = require('async');

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
var path = '/notifications';
var pathUsersSelf = '/users/self';
var pathEssences = '/essences';
var tokenSuperAdmin;
var tokenAdmin;
var tokenUser1;
var tokenUser2;
var tokenUser3;

// make all users list
testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin', 'admin', 'users']);
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['superAdmin']); // for debug only
//testEnv.allUsers = ithelper.getAllUsersList(testEnv, ['users']); // for debug only

describe('Notifications:', function () {

    function allTests() {
        describe('Select: ', function () {
            it('True number of records (superAdmin) = 5', function (done) {
                tokenSuperAdmin = ithelper.getUser(testEnv.allUsers, 1).token;
                ithelper.selectCount(testEnv.api, path, tokenSuperAdmin, 200, 5, done); // 5 records "Indaba. Restore password"
            });
            it('True number of records (admin) = 1', function (done) {
                tokenAdmin = ithelper.getUser(testEnv.allUsers, 2).token;
                ithelper.selectCount(testEnv.api_created_realm, path, tokenAdmin, 200, 1, done); // 1 record "Indaba. Organization membership"
            });
            it('True number of records (user 1) = 1', function (done) {
                tokenUser1 = ithelper.getUser(testEnv.allUsers, 3, 1).token;
                ithelper.selectCount(testEnv.api_created_realm, path, tokenUser1, 200, 1, done); // 1 record "Indaba. Organization membership"
            });
            it('True number of records (user 2) = 1', function (done) {
                tokenUser2 = ithelper.getUser(testEnv.allUsers, 3, 2).token;
                ithelper.selectCount(testEnv.api_created_realm, path, tokenUser2, 200, 1, done); // 1 record "Indaba. Organization membership"
            });
            it('True number of records (user 3) = 1', function (done) {
                tokenUser3 = ithelper.getUser(testEnv.allUsers, 3, 3).token;
                ithelper.selectCount(testEnv.api_created_realm, path, tokenUser3, 200, 1, done); // 1 record "Indaba. Organization membership"
            });
        });
        describe('Prepare: get users Id ', function () {
            it('Get SuperAdmin Id ', function (done) {
                ithelper.getUserId(testEnv.api, pathUsersSelf, tokenSuperAdmin, 200, obj, 'superAdminId', done);
            });
            it('Get Admin Id ', function (done) {
                ithelper.getUserId(testEnv.api_created_realm, pathUsersSelf, tokenAdmin, 200, obj, 'adminId', done);
            });
            it('Get User1 Id ', function (done) {
                ithelper.getUserId(testEnv.api_created_realm, pathUsersSelf, tokenUser1, 200, obj, 'user1Id', done);
            });
            it('Get Essence Id for Users', function (done) {
                ithelper.getEssenceId(testEnv.api_created_realm, pathEssences, 'Users', tokenAdmin, 200, obj, 'essenceIdUser', done);
            });
        });
        describe('Errors creating notification: ', function () {
            it('userTo must be specified', function (done) {
                var insertItem = {body: 'Test notification'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'must be specified', done);
            });
            it('userTo must be integer', function (done) {
                var insertItem = {userTo: 'userFrom', body: 'Test notification'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'must be integer', done);
            });
            it('userFrom (id) have to exist', function (done) {
                var insertItem = {userTo: 999, body: 'Test notification'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'does not exist', done);
            });
            it('Body must be specified', function (done) {
                var insertItem = {userTo: obj.adminId};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'must be specified', done);
            });
            it('Essence Id must be integer', function (done) {
                var insertItem = {userTo: obj.adminId, essenceId: 'essenceId', body: 'Test notification'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'must be integer', done);
            });
            it('Essence Id have to exist', function (done) {
                var insertItem = {userTo: obj.adminId, essenceId: 999, body: 'Test notification'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'does not exist', done);
            });
        });
        describe('Create notifications: ', function () {
            it('(1) Without essenceId, `from superAdmin to admin`', function (done) {
                var insertItem = {userTo: obj.adminId, body: 'Test notification 1'};
                ithelper.insertOne(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 201, obj, 'id1', done);
            });
            it('(Err) With essenceId for `Users` and entityId for `SuperAdmin`, from superAdmin to admin - error: entityId for `SuperAdmin` does not exist in organization', function (done) {
                var insertItem = {userTo: obj.adminId, essenceId: obj.essenceIdUser, entityId: obj.superAdminId, body: 'Test notification (Err)'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 400, 403, 'does not exist', done);
            });
            it('(2) With essenceId for `Users` and entityId for `User1`, `from superAdmin to user1`', function (done) {
                var insertItem = {userTo: obj.user1Id, essenceId: obj.essenceIdUser, entityId: obj.user1Id, body: 'Test notification 2'};
                ithelper.insertOne(testEnv.api_created_realm, path, tokenSuperAdmin, insertItem, 201, obj, 'id2', done);
            });
            it('(3) From admin to user1', function (done) {
                var insertItem = {userTo: obj.user1Id, body: 'Test notification 3'};
                ithelper.insertOne(testEnv.api_created_realm, path, tokenAdmin, insertItem, 201, obj, 'id3', done);
            });
        });
        describe('Create reply notifications: ', function () {
            it('(4) Reply to (1) `from admin to superAdmin` as superAdmin', function (done) {
                var insertItem = {body: 'Reply 4 for Test notification 1'};
                ithelper.insertOne(testEnv.api_created_realm, path+'/reply/'+obj.id1, tokenSuperAdmin, insertItem, 201, obj, 'id4', done);
            });
            it('(Err) Reply to (1) `from admin to superAdmin` as user1 - error: You cannot send reply for this notification', function (done) {
                var insertItem = {body: 'Reply for Test notification 1 (Err)'};
                ithelper.insertOneErrMessage(testEnv.api_created_realm, path+'/reply/'+obj.id1, tokenUser1, insertItem, 400, 403, 'You cannot send reply for this notification', done);
            });
            it('(5) Reply to (3) `from admin to user1` as user1', function (done) {
                var insertItem = {body: 'Reply 5 for Test notification 3'};
                ithelper.insertOne(testEnv.api_created_realm, path+'/reply/'+obj.id3, tokenUser1, insertItem, 201, obj, 'id5', done);
            });
        });

        describe('Check users notifications: ', function () {
            describe('userId filter: ', function () {
                it('True number of records (userId = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userId='+obj.user1Id, tokenAdmin, 200, 4, done);
                });
                it('True number of records (userId = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userId='+obj.user1Id, tokenUser1, 200, 4, done);
                });
                it('True number of records (userId = user1Id) as user2 - userId ignored, return only records for user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userId='+obj.user1Id, tokenUser2, 200, 1, done);
                });
            });
            describe('userFrom filter: ', function () {
                it('True number of records (userFrom = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id, tokenAdmin, 200, 2, done);
                });
                it('True number of records (userFrom = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id, tokenUser1, 200, 1, done);
                });
                it('True number of records (userFrom = user1Id) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id, tokenUser2, 200, 0, done);
                });
            });
            describe('userTo filter: ', function () {
                it('True number of records (userTo = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userTo='+obj.user1Id, tokenAdmin, 200, 4, done);
                });
                it('True number of records (userTo = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userTo='+obj.user1Id, tokenUser1, 200, 1, done);
                });
                it('True number of records (userTo = user1Id) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userTo='+obj.user1Id, tokenUser2, 200, 0, done);
                });
            });
            describe('userFrom & userTo filter: ', function () {
                it('True number of records (userFrom = user1Id, userTo = adminId) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenAdmin, 200, 2, done);
                });
                it('True number of records (userFrom = user1Id, userTo = adminId) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenUser1, 200, 4, done);
                });
                it('True number of records (userFrom = user1Id, userTo = adminId) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'/users?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenUser2, 200, 1, done);
                });
            });
        });

        describe('Check notifications SELECT: ', function () {
            describe('userId filter: ', function () {
                it('True number of records (userId = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id, tokenAdmin, 200, 4, done);
                });
                it('True number of records (userId = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id, tokenUser1, 200, 4, done);
                });
                it('True number of records (userId = user1Id) as user2 - userId ignored, return only records for user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id, tokenUser2, 200, 1, done);
                });
            });
            describe('userFrom filter: ', function () {
                it('True number of records (userFrom = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id, tokenAdmin, 200, 1, done);
                });
                it('True number of records (userFrom = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id, tokenUser1, 200, 1, done);
                });
                it('True number of records (userFrom = user1Id) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id, tokenUser2, 200, 0, done);
                });
            });
            describe('userTo filter: ', function () {
                it('True number of records (userTo = user1Id) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userTo='+obj.user1Id, tokenAdmin, 200, 2, done);
                });
                it('True number of records (userTo = user1Id) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userTo='+obj.user1Id, tokenUser1, 200, 1, done);
                });
                it('True number of records (userTo = user1Id) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userTo='+obj.user1Id, tokenUser2, 200, 0, done);
                });
            });
            describe('userFrom & userTo filter: ', function () {
                it('True number of records (userFrom = user1Id, userTo = adminId) as admin', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenAdmin, 200, 1, done);
                });
                it('True number of records (userFrom = user1Id, userTo = adminId) as user1', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenUser1, 200, 4, done);
                });
                it('True number of records (userFrom = user1Id, userTo = adminId) as user2', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userFrom='+obj.user1Id+'&userTo='+obj.adminId, tokenUser2, 200, 1, done);
                });
            });
        });

        describe('Check notifications READ/UNREAD: ', function () {
            describe('READ filter: ', function () {
                it('True number of records (userId = user1Id) as admin - READ', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=true', tokenAdmin, 200, 0, done);
                });
                it('True number of records (userId = user1Id) as admin - UNREAD', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=false', tokenAdmin, 200, 4, done);
                });
            });
            describe('Mark read/unread: ', function () {
                it('Mark (5) as READ', function (done) {
                    ithelper.updateOne(testEnv.api_created_realm, path + '/markread/' + obj.id5, tokenAdmin, {}, 202, done);
                });
                it('Check `READ` records after mark as READ', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=true', tokenAdmin, 200, 1, done);
                });
                it('Check `UNREAD` records after mark as READ', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=false', tokenAdmin, 200, 3, done);
                });
                it('Mark (5) as UNREAD', function (done) {
                    ithelper.updateOne(testEnv.api_created_realm, path + '/markunread/' + obj.id5, tokenAdmin, {}, 202, done);
                });
                it('Check `READ` records after mark as UNREAD', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=true', tokenAdmin, 200, 0, done);
                });
                it('Check `UNREAD` records after mark as UNREAD', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=false', tokenAdmin, 200, 4, done);
                });
                it('Mark ALL (userFrom = user1) as READ', function (done) {
                    ithelper.updateOne(testEnv.api_created_realm, path + '/markallread/?userFrom=' + obj.user1Id, tokenAdmin, {}, 202, done);
                });
                it('Check `READ` records after mark as READ', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=true', tokenAdmin, 200, 2, done);
                });
                it('Check `UNREAD` records after mark as READ', function (done) {
                    ithelper.selectCount(testEnv.api_created_realm, path+'?userId='+obj.user1Id+'&read=false', tokenAdmin, 200, 2, done);
                });
                it('Mark invite user notification with id=3 as UNREAD - "status quo"', function (done) {
                    ithelper.updateOne(testEnv.api_created_realm, path + '/markunread/3', tokenAdmin, {}, 202, done);
                });
            });
        });
        describe('RESEND notifications: ', function () {
            it('Resend (5)', function (done) {
                ithelper.updateOne(testEnv.api_created_realm, path + '/resend/' + obj.id5, tokenAdmin, {}, 202, done);
            });
            it('Resend user invite (user1)', function (done) {
                ithelper.updateOne(testEnv.api_created_realm, path + '/resenduserinvite/' + obj.user1Id, tokenAdmin, {}, 202, done);
            });
        });

        describe('Delete all entities after tests completed', function () {
            it('Delete created notification (1)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?id=' + obj.id1, tokenSuperAdmin, 204, done);
            });
            it('Delete created notification (2)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?id=' + obj.id2, tokenSuperAdmin, 204, done);
            });
            it('Delete created notification (3)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?id=' + obj.id3, tokenSuperAdmin, 204, done);
            });
            it('Delete created notification (4)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?id=' + obj.id4, tokenSuperAdmin, 204, done);
            });
            it('Delete created notification (5)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?id=' + obj.id5, tokenSuperAdmin, 204, done);
            });
            it('Delete all notification (userFrom = admin, userTo = user1)', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/delete?userFrom=' + obj.adminId+'&userTo='+obj.user1Id, tokenSuperAdmin, 204, done);
            });
        });
    }

    async.each(testEnv.allUsers, function(user, doneUser){
            // Authorize users and save token for later use
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
                        user.token = res.body.token;
                        done();
                        doneUser();
                    });
            });
        }, function (err) {
            //console.log('Authorize all users - done');
            allTests();
        }
    );

});
