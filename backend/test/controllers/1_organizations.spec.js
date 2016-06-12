/**
 * Here we are crete all the necessary namespaces and users to work with it in future
 *
 */

var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var request = require('supertest');

var superAdmin = config.testEntities.superAdmin;
var admin = config.testEntities.admin;
var organization = config.testEntities.organization;
var users = config.testEntities.users;

var api_base = 'http://localhost:' + config.port + '/';
var api = request.agent(api_base + config.pgConnect.adminSchema + '/v0.2');
var api_created_realm = request.agent(api_base + organization.realm + '/v0.2');

var suToken;
var admToken;
var activationToken;
var orgId;

describe('Organizations:', function () {

    it('Get a token for super admin', function (done) {

        api
            .get('/users/token')
            .set('Authorization', 'Basic ' + new Buffer(superAdmin.email + ':' + superAdmin.password).toString('base64'))
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

    describe('Creation new organization', function () {

        it('Inserts a new organization (with creating new schema) into db, data = ' + JSON.stringify(organization), function (done) {

            api
                .post('/organizations')
                .set('token', suToken)
                .send(organization)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    orgId = res.body.id;
                    done();
                });
        });

        it('Checks for an organization in new realm as a super', function (done) {
            api_created_realm
                .get('/organizations/' + orgId)
                .set('token', suToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.realm).to.equal(organization.realm);
                    done();
                });
        });

    });

    describe('Invites an admin to organization', function () {

        it('Sends invitation to user', function (done) {
            api_created_realm
                .post('/users/self/organization/invite/')
                .set('token', suToken)
                .send(admin)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.activationToken).to.be.a('string');

                    activationToken = res.body.activationToken;

                    done();
                });
        });

        it('Company admin checks activation token', function (done) {
            console.log(activationToken);
            api_created_realm
                .get('/users/activate/' + activationToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        it('Company admin fills an activation form and try to activate account', function (done) {
            api_created_realm
                .post('/users/activate/' + activationToken)
                .expect(200)
                .send(admin)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        it('Company admin try to authorize', function (done) {
            api_created_realm
                .get('/users/token')
                .set(
                    'Authorization',
                    'Basic ' + new Buffer(admin.email + ':' + admin.password).toString('base64')
                )
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
    });

});
