/**
 * Rights tests
 *
 * prerequsites tests: organizations, users
 *
 * used entities: organization, users, roles
     //[
     //{action: 'rights_view_all'},
     //{action: 'rights_add_one'},
     //{action: 'rights_view_one'},
     //{action: 'rights_delete_one'},
     //{action: 'rights_edit_one'},
     //{action: 'users_view_all'},
     //{action: 'users_edit_one'},
     //{action: 'users_view_one'},
     //{action: 'users_delete_one'},
     //{action: 'users_token'},
     //{action: 'users_logout_self'},
     //{action: 'users_logout'},
     //{action: 'users_view_self'},
     //{action: 'users_edit_self'},
     //{action: 'role_rights_view_one'},
     //{action: 'role_rights_add'},
     //{action: 'product_delete', essenceId: 4},
     //{action: 'users_uoa'},
     //{action: 'product_uoa', essenceId: 4},
     //{action: 'users_invite'},
     //{action: 'unitofanalysis_insert_one', essenceId: 6},
     //{action: 'unitofanalysis_update_one', essenceId: 6},
     //{action: 'unitofanalysis_delete_one', essenceId: 6},
     //{action: 'groups_delete'}
     //];
 *
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
testEnv.backendServerDomain = 'http://localhost'; // ToDo: to config

testEnv.api_base = testEnv.backendServerDomain + ':' + config.port + '/';
testEnv.api = request.agent(testEnv.api_base + config.pgConnect.adminSchema + '/v0.2');
testEnv.api_created_realm = request.agent(testEnv.api_base + config.testEntities.organization.realm + '/v0.2');

var allUsers = [];
var token;
var obj = {};
var path = '/rights';
var rightsContent = [{
    action: 'rights_view_all'
}, {
    action: 'rights_add_one'
}, {
    action: 'rights_view_one'
}, {
    action: 'rights_delete_one'
}, {
    action: 'rights_edit_one'
}, {
    action: 'users_view_all'
}, {
    action: 'users_edit_one'
}, {
    action: 'users_view_one'
}, {
    action: 'users_delete_one'
}, {
    action: 'users_token'
}, {
    action: 'users_logout_self'
}, {
    action: 'users_logout'
}, {
    action: 'users_view_self'
}, {
    action: 'users_edit_self'
}, {
    action: 'role_rights_view_one'
}, {
    action: 'role_rights_add'
}, {
    action: 'product_delete',
    essenceId: 4
}, {
    action: 'users_uoa'
}, {
    action: 'product_uoa',
    essenceId: 4
}, {
    action: 'users_invite'
}, {
    action: 'unitofanalysis_insert_one',
    essenceId: 6
}, {
    action: 'unitofanalysis_update_one',
    essenceId: 6
}, {
    action: 'unitofanalysis_delete_one',
    essenceId: 6
}, {
    action: 'groups_delete'
}];
var numberOfRecords = 24;
var insertItem = {
    action: 'testRight',
    description: 'test Right Description'
};
var updateItem = {
    action: 'rightTest',
    description: 'Right Test Description'
};
var testTitle = 'Rights: ';

describe(testTitle, function () {

    before(function (done) {
        // authorize users
        // allUsers.concat(config.testEntities.users);
        allUsers = ithelper.getAllUsersList(config.testEntities, ['superAdmin', 'admin', 'users']);
        ithelper.getTokens(allUsers).then(
            (res) => {
                allUsers = res;
                done();
            },
            (err) => done(err)
        );
    });

    function userTests(user) {
        describe(testTitle + 'All of tests for user `' + user.firstName + '`', function () {
            // ordinary users does not have rights to view rights
            it('(Err) No rights to select for ordinary users', function (done) {
                ithelper.getCheckRights(testEnv.api_created_realm, path, user.token, 400, 401, 'User\'s role has not permission for this action(s): rights_view_all', done);
            });
        });
    }

    function adminTests(user) {
        describe(testTitle + 'All of tests for admin `' + user.firstName + '`', function () {
            it('Select true number of records', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, numberOfRecords, done);
            });

            it('Select initial content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path + '?order=id', user.token, 200, rightsContent, done);
            });
            it('CRUD: Create new Right - "testRight"', function (done) {
                ithelper.insertOne(testEnv.api_created_realm, path, user.token, insertItem, 201, obj, 'id', done);
                numberOfRecords++;
            });
            it('CRUD: Get created Right', function (done) {
                ithelper.selectOneCheckFields(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, insertItem, done);
            });
            it('CRUD: Update Right', function (done) {
                ithelper.updateOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, updateItem, 202, done);
            });
            it('CRUD: Get updated Role', function (done) {
                ithelper.selectOneCheckFields(testEnv.api_created_realm, path + '/' + obj.id, user.token, 200, null, updateItem, done);
            });
            it('CRUD: True number of records after insert', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, numberOfRecords, done);
            });
            it('Select new content', function (done) {
                rightsContent.push(updateItem);
                ithelper.selectCheckAllRecords(testEnv.api_created_realm, path + '?order=id', user.token, 200, rightsContent, done);
            });
            it('Delete test right', function (done) {
                ithelper.deleteOne(testEnv.api_created_realm, path + '/' + obj.id, user.token, 204, done);
                rightsContent.splice(-1, 1);
                numberOfRecords--;
            });
            it('Select true number of records (after delete)', function (done) {
                ithelper.selectCount(testEnv.api_created_realm, path, user.token, 200, numberOfRecords, done);
            });
        });
    }

    it(testTitle + 'start', function (done) {
        adminTests(ithelper.getUser(allUsers, 1));
        adminTests(ithelper.getUser(allUsers, 2));
        for (var i = 0; i < config.testEntities.users.length; i++) {
            userTests(ithelper.getUser(allUsers, 3, i + 1));
        }
        done();
    });

});
