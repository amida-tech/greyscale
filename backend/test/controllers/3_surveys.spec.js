/**
 * Surveys tests
 **/

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var config = require('../../config/config');
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
var path = '/surveys';
var testTitle = 'Surveys: ';

var insertItem = {
    title: 'Test survey',
    description: 'Description of test survey',
    projectId: 2 // TODO get from user self
};
var updateItem = {
    title: insertItem.title + ' --- updated',
    description: insertItem.description + ' --- updated'
};
var surveyQuestions = [{
    'label': 'Text 1',
    'isRequired': true,
    'hasComments': true,
    'type': 0,
    'position': 1,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
}, {
    'label': 'Bullet points 2',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 11,
    'position': 2,
    'description': 'Description 2',
    'qid': 'Question ID 1',
    'skip': 0,
    'size': 0,
    'value': 'Value 1'
}, {
    'label': 'Paragraph 3',
    'isRequired': true,
    'type': 1,
    'position': 3,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
}, {
    'label': 'Multiple choice 4',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 3,
    'position': 4,
    'description': 'Description 4',
    'qid': '',
    'skip': 0,
    'size': 0,
    'incOtherOpt': true,
    'value': 'Value Other',
    'optionNumbering': 'decimal',
    'options': [{
        'label': 'Label 1',
        'value': 'Value 1',
        'isSelected': true
    }, {
        'label': 'Label 2',
        'value': 'Value 2',
        'isSelected': false
    }]
}, {
    'label': 'Checkboxes 5',
    'isRequired': true,
    'attachment': true,
    'hasComments': true,
    'withLinks': false,
    'type': 2,
    'position': 5,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0,
    'incOtherOpt': true,
    'value': 'Other3',
    'optionNumbering': 'lower-latin',
    'options': [{
        'label': 'L1',
        'value': 'V1',
        'isSelected': true
    }, {
        'label': 'L2',
        'value': 'V2',
        'isSelected': false
    }]
}];

var surveyQuestions4Check = _.each(surveyQuestions, function (item, i, array) {
    array[i] = _.omit(item, 'options');
});

var insertQuestion = {
    'label': 'One more text',
    'isRequired': true,
    'hasComments': true,
    'type': 0,
    'position': 6,
    'description': '',
    'qid': '',
    'skip': 0,
    'size': 0
};

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
                ithelper.doSql('test/postSurveys.sql', config.testEntities.organization.realm, done);
            });
        });
        describe(testTitle + 'Prepare for test', function () {
            /*
                        it('Do prepare SQL script ', function (done) {
                            ithelper.doSql('test/preSurveys.sql', config.testEntities.organization.realm, done);
                        });
            */
        });

        describe(testTitle + 'Select before testing', function () {
            it('True number of records (superAdmin) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenSuperAdmin, 200, 0, done);
            });
            it('True number of records (admin) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenAdmin, 200, 0, done);
            });
            it('True number of records (user1) = 0', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenUser1, 200, 0, done);
            });
        });

        describe(testTitle + 'CRUD', function () {
            it('Create new survey', function (done) {
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, insertItem, 'id', done);
            });
            it('True number of records', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenAdmin, 200, 1, done);
            });
            it('Get created survey', function (done) {
                ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 200, null, 'title', insertItem.title, done);
            });
            it('Update survey', function (done) {
                ithelper.updateOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, updateItem, 202, done);
            });
            it('Get updated survey', function (done) {
                ithelper.selectOneCheckFields(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 200, null, updateItem, done);
            });
            it('Delete created/updated survey', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 204, done);
            });
            it('True number of surveys after delete', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenAdmin, 200, 0, done);
            });
        });

        describe(testTitle + 'CRUD + Questions', function () {
            it('Create new survey with questions', function (done) {
                insertItem.questions = surveyQuestions;
                ithelper.insertOne(testEnv.apiCreatedRealm, path, tokenAdmin, insertItem, 201, insertItem, 'id', done);
            });
            it('True number of records', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenAdmin, 200, 1, done);
            });
            it('Get created survey', function (done) {
                ithelper.selectOneCheckField(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 200, null, 'title', insertItem.title, done);
            });
            it('Number of questions (=5)', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path + '/' + insertItem.id + '/questions', tokenAdmin, 200, 5, done);
            });
            it('Check question`s content', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/' + insertItem.id + '/questions?order=id', tokenAdmin, 200, surveyQuestions, done);
            });
            it('Create new question for survey', function (done) {
                ithelper.insertOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id + '/questions', tokenAdmin, insertQuestion, 201, insertQuestion, 'id', done);
                surveyQuestions.push(insertQuestion);
            });
            it('Check question`s content with new question', function (done) {
                ithelper.selectCheckAllRecords(testEnv.apiCreatedRealm, path + '/' + insertItem.id + '/questions?order=id', tokenAdmin, 200, surveyQuestions, done);
            });
            it('Create new question for survey', function (done) {
                insertQuestion.label = insertQuestion.label + ' --- updated';
                ithelper.updateOne(testEnv.apiCreatedRealm, '/questions/' + insertQuestion.id, tokenAdmin, insertQuestion, 202, done);
            });
            it('Delete new question', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, '/questions/' + insertQuestion.id, tokenAdmin, 204, done);
            });
            it('Delete created/updated survey', function (done) {
                ithelper.deleteOne(testEnv.apiCreatedRealm, path + '/' + insertItem.id, tokenAdmin, 204, done);
            });
            it('True number of surveys after delete', function (done) {
                ithelper.selectCount(testEnv.apiCreatedRealm, path, tokenAdmin, 200, 0, done);
            });
        });

        describe(testTitle + 'Clean up', function () {
            /*
                        it('Do clean up SQL script ', function (done) {
                            ithelper.doSql('test/postDiscussions.sql', config.testEntities.organization.realm, done);
                        });
            */
        });

    }

    allTests();

});
