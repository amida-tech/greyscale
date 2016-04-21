var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var request = require('supertest');

var superAdmin   = config.testEntities.superAdmin;
var admin        = config.testEntities.admin;
var users        = config.testEntities.users;
var organization = config.testEntities.organization;

var api_base          = 'http://localhost:' + config.port + '/';
var api               = request.agent(api_base + config.pgConnect.adminSchema + '/v0.2');
var api_created_realm = request.agent(api_base + organization.realm + '/v0.2');

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
    }

    function inviteUserTest(user){
        it('Invite usual user ' + user.firstName, function (done) {
            api_created_realm
                .post('/users/self/organization/invite') // invite
                .send(user)
                .set('token', admToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.activationToken).to.exist;

                    api_created_realm
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

    it('Edit usual users info', function (done) {
        done();
    });

    it('Delete usual user', function (done) {
        done();
    });

});