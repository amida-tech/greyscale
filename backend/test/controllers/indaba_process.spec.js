var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var request = require('supertest');

var superAdmin = {
    email: 'test-su@mail.net',
    pass: 'testuser'
}

var api = request.agent('http://localhost:' + config.port + '/' + config.pgConnect.adminSchema + '/v0.2');

var token;

var Client = require('pg').Client;
var api_created_realm;

describe('Organizations:', function () {

    it('Get a token for super admin', function (done) {

        api
            .get('/users/token')
            .set('Authorization', 'Basic ' + new Buffer(superAdmin.email + ':' + superAdmin.pass).toString('base64'))
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                console.log(res.body.token);
                expect(res.body.token).to.exist;
                token = res.body.token;
                done();
            });
    });

    describe('Creation new organization', function () {

        var data = {
            name: 'Test organization',
            realm: 'testorg'
        };
        var orgId;

        it('Inserts a new organization (with creating new schema) into db, data = ' + JSON.stringify(data), function (done) {

            api
                .post('/organizations')
                .set('token', token)
                .send(data)
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
            api_created_realm = request.agent('http://localhost:' + config.port + '/' + data.realm + '/v0.2');

            api_created_realm
                .get('/organizations/'+orgId)
                .set('token', token)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.realm).to.equal(data.realm);
                    done();
                });
        });

    });

    //describe('Invite an admin to organization', function () {
    //    var data = {
    //        email: 'test-adm@mail.net',
    //        firstName: 'Test',
    //        lastName: 'Admin',
    //        roleID: 2
    //    };
    //
    //    it('Sends invitation to user', function (done) {
    //        api_created_realm
    //            .post('/users/self/organization/invite/')
    //            .set('token', token)
    //            .send(data)
    //            .expect(201)
    //            .end(function (err, res) {
    //                if (err) {
    //                    return done(err);
    //                }
    //                console.log(res.body);
    //                //expect(res.body.realm).to.equal(data.realm);
    //                done();
    //            });
    //    });
    //});


});
