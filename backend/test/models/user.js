var UserFactory = require('test/factories/user'),
    mongoose = require('mongoose'),
    expect = require('chai').expect,
    async = require('async'),
    config = require('config');

describe('User', function() {
  before(function(done) {
    mongoose.connect(config.db, done); // connect to mongodb
  });

  before(function(done) {
    mongoose.connection.db.dropDatabase(done); // drop database and proceed with clean one
  });

  it('has valid factory', function(done) {
    UserFactory.build().validate(done);
  });

  it('is invalid without email', function(done) {
    UserFactory.build({ email: undefined }).validate(function(err) {
      expect(err).to.exist;
      expect(err.name).to.equal('ValidationError');
      done();
    });
  });

  it('is invalid if email duplicated', function(done) {
    UserFactory.create({email: 'duplicated@gmail.com'}).onResolve(function(err, first) {
      expect(err).to.not.exist;
      UserFactory.build({ email: first.email }).validate(function(err) {
        expect(err).to.exist;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });
  });

  it('is invalid without password', function(done) {
    UserFactory.build({ password: undefined }).validate(function(err) {
      expect(err).to.exist;
      expect(err.name).to.equal('ValidationError');
      done();
    });
  });

  it('is invalid without first and/or last name', function(done) {
    async.series([
      function(done) {
        UserFactory
        .build({ name: { firstName: undefined } })
        .validate(function(err) {
          expect(err).to.exist;
          expect(err.name).to.equal('ValidationError');
          done();
        });
      },
      function(done) {
        UserFactory
        .build({ name: { lastName: undefined } })
        .validate(function(err) {
          expect(err).to.exist;
          expect(err.name).to.equal('ValidationError');
          done();
        });
      },
      function(done) {
        UserFactory
        .build({ name: { firstName: undefined, lastName: undefined } })
        .validate(function(err) {
          expect(err).to.exist;
          expect(err.name).to.equal('ValidationError');
          done();
        });
      }
    ], function() {
      done();
    });
  });

  after(function(done) {
    mongoose.disconnect(done);
  });
});

