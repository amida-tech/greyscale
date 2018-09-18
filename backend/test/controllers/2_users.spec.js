var chai = require('chai');
var expect = chai.expect;
var config = require('../../config/config');
var request = require('supertest');

var superAdmin = config.testEntities.superAdmin;
var admin = config.testEntities.admin;
var users = config.testEntities.users;
var organization = config.testEntities.organization;

var apiBase = 'http://localhost:' + config.port + '/';
var api = request.agent(apiBase + config.pgConnect.adminSchema + '/v0.2');
var apiCreatedRealm = request.agent(apiBase + organization.realm + '/v0.2');

var suToken;
var admToken;
var activationToken;
var orgId;

describe('Users:', function () {

    it('Get a token for an admin', function (done) {
        api
            .get('/users/token')
            .set('Authorization', 'Basic ' + new Buffer(admin.email + ':' + admin.password).toString('base64'))
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.token).to.exist;
                admToken = res.body.token;
                done();
            });
    });

    it('Edit admin data', function (done) {
        done();
    });

    for (var i in users) {
        inviteUserTest(users[i]);
        //loginUserTest(users[i]);
    }

    function inviteUserTest(user) {
        it('Invite usual user ' + user.firstName, function (done) {
            apiCreatedRealm
                .post('/users/self/organization/invite') // invite
                .send(user)
                .set('token', admToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.activationToken).to.exist;

                    apiCreatedRealm
                        .post('/users/activate/' + res.body.activationToken) // and activate
                        .expect(200)
                        .send(user)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }
                            done();
                        });
                });
        });
    }

    function loginUserTest(user) {
        it('Authorize usual user ' + user.firstName, function (done) {
            apiCreatedRealm
                .get('/users/token')
                .set('Authorization', 'Basic ' + new Buffer(user.email + ':' + user.password).toString('base64'))
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.token).to.exist;
                });
        });
    }

    it('Edit usual users info', function (done) {
        done();
    });

    it('Delete usual user', function (done) {
        done();
    });

});
