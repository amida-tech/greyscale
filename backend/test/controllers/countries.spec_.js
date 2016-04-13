var chai = require('chai');
var expect = chai.expect;

var request = require('supertest');
var api = request.agent('http://localhost:3005/test/v0.2');
var token;

var config = require('../../config');
var Client = require('pg').Client;

describe('Countries Controller:', function () {

    it('get a token', function (done) {
        api
            .get('/users/token')
            .set('Authorization', 'Basic ' + new Buffer('su@mail.net:testuser').toString('base64'))
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.token).to.exist;
                token = res.body.token;
                done();
            });
    });

    describe('select', function () {

        it('correctly sets the X-Total-Count header', function (done) {
            api
                .get('/countries')
                .set('token', token)
                .expect(200)
                .expect('X-Total-Count', 240)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        it('correctly sets the results JSON', function (done) {
            api
                .get('/countries')
                .set('token', token)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.exist;
                    expect(res.body.length).to.equal(240);
                    done();
                });
        });

    });

    describe('insertOne', function () {

        it('inserts a new document into postgres', function (done) {

            var data = {
                name: 'Christmas Island',
                alpha2: 'CI',
                alpha3: 'CHR',
                nbr: 1000
            };

            api
                .post('/countries')
                .set('token', token)
                .send(data)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var client = new Client(config.pgConnect);
                    client.connect(function (err) {
                        if (err) {
                            return done(err);
                        }
                        client.query('SELECT * FROM "Countries" WHERE "Countries"."name" = $1', ['Christmas Island'], function (err, result) {
                            if (err) {
                                return done(err);
                            }
                            expect(result.rows.length).to.equal(1);
                            expect(result.rows[0].name).to.equal('Christmas Island');
                            client.end();
                            done();
                        });
                    });
                });
        });

        it('returns the id of the newly inserted document', function (done) {

            var data = {
                name: 'Isle of Man',
                alpha2: 'IM',
                alpha3: 'IOM',
                nbr: 1001
            };

            api
                .post('/countries')
                .set('token', token)
                .send(data)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.exist;
                    expect(res.body.id).to.exist;
                    expect(res.body.id).to.be.a('number');
                    done();
                });
        });

    });

    describe('updateOne', function () {

        it('updates a document in postgres', function (done) {

            var data = {
                alpha2: 'AG',
            };

            api
                .put('/countries/8')
                .set('token', token)
                .send(data)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var client = new Client(config.pgConnect);
                    client.connect(function (err) {
                        if (err) {
                            return done(err);
                        }
                        client.query('SELECT * FROM "Countries" WHERE "Countries"."name" = $1', ['ANGUILLA'], function (err, result) {
                            if (err) {
                                return done(err);
                            }
                            expect(result.rows.length).to.equal(1);
                            expect(result.rows[0].alpha2).to.equal('AG');
                            client.end();
                            done();
                        });
                    });
                });
        });

    });

    describe('deleteOne', function () {

        it('removes a document from postgres', function (done) {

            api
                .delete('/countries/2')
                .set('token', token)
                .expect(204)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    var client = new Client(config.pgConnect);
                    client.connect(function (err) {
                        if (err) {
                            return done(err);
                        }
                        client.query('SELECT * FROM "Countries" WHERE "Countries"."name" = $1', ['AFGHANISTAN'], function (err, result) {
                            if (err) {
                                return done(err);
                            }
                            expect(result.rows).to.be.empty;
                            client.end();
                            done();
                        });
                    });
                });
        });

    });

});
