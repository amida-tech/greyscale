var chai = require('chai');
var expect = chai.expect;

var request = require('supertest');
var api = request.agent('http://localhost:3005/test/v0.2');

var token;

describe('Countries Controller:', function () {

    it('get a token', function (done) {
        api
            .get('/users/token')
            .set('Authorization', 'Basic ' + new Buffer('no@mail.net:testuser').toString('base64'))
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

    });

    describe('updateOne', function () {

    });

    describe('deleteOne', function () {

    });

});
