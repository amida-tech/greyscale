var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var request = require('supertest');

var superAdmin   = config.testEntities.superAdmin;
var admin        = config.testEntities.admin;
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
                suToken = res.body.token;
                done();
            });
    });

    it('Edit admin data', function (done) {
        done();
    });

    it('Invite usual users', function (done) {
        done();
    });

    it('Edit usual users info', function (done) {
        done();
    });

    it('Delete usual user', function (done) {
        done();
    });

});