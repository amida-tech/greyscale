var app = require('app/bootstrap'),
    request = require('supertest'),
    mongoose = require('mongoose'),
    expect = require('chai').expect,
    async = require('async'),
    UserFactory = require('test/factories/user');

describe('User API', function() {
  before(function(done) {
    // Wait for database connection and server start listening
    // TODO: Rewrite this using callbacks
    setTimeout(function() {
      done();
    }, 200);
  });

  before(function(done) {
    // Clear database
    mongoose.connection.db.dropDatabase(done);
  });

  var adminEmail = 'admin@gmail.com';
  var adminPassw = 'admin1234';
  var adminToken;
  var customerEmail = 'customer@gmail.com';
  var customerPassw = 'customer1234';
  var customerToken;

  describe('POST api/users', function() {
    it('always does create admin if it is a first user', function(done) {
      async.waterfall([
        function(next) {
          // First created user should always be admin
          request(app).post('/api/users').type('json')
            .send(UserFactory.attributes({
              role: 'customer', // Despite this, should create admin
              email: adminEmail,
              password: adminPassw
            }))
            .expect(200, next);
        },
        function(res, next) {
          // Get admin token
          request(app).get('/api/users/token').auth(adminEmail, adminPassw)
            .expect(200, next);
        },
        function(res, next) {
          // Check if admin created
          adminToken = res.body.token;
          request(app).get('/api/users/self')
            .set('token', res.body.token)
            .expect(function(res) {
              expect(res.status).to.equal(200);
              expect(res.body.role).to.equal('admin');
            })
            .end(next);
        }
      ], function(err) {
        done(err);
      });
    });

    it('does create new customer without authentication', function(done) {
      async.waterfall([
        function(next) {
          // Create customer
          request(app).post('/api/users').type('json')
            .send(UserFactory.attributes({
              role: 'customer',
              email: customerEmail,
              password: customerPassw
            }))
            .expect(200, next);
        },
        function(res, next) {
          // Get customer token
          request(app).get('/api/users/token').auth(customerEmail, customerPassw)
            .expect(200, next);
        },
        function(res, next) {
          // Check if customer created
          customerToken = res.body.token;
          request(app).get('/api/users/self')
            .set('token', res.body.token)
            .expect(function(res) {
              expect(res.status).to.equal(200);
              expect(res.body.role).to.equal('customer');
            })
            .end(next);
        }
      ], function(err) {
        done(err);
      });
    });

    it('does not create new admin if not authorized as admin', function(done) {
      async.parallel([
        function(done) {
          // Unauthorized
          request(app).post('/api/users').type('json')
            .send(UserFactory.attributes({ role: 'admin' }))
            .expect(401, done);
        },
        function(done) {
          // Admin, basic auth
          request(app).post('/api/users').type('json').auth(adminEmail, adminPassw)
            .send(UserFactory.attributes({ role: 'admin' }))
            .expect(401, done);
        },
        function(done) {
          // Customer
          request(app).post('/api/users').type('json').set('token', customerToken)
            .send(UserFactory.attributes({ role: 'admin' }))
            .expect(401, done);
        }
      ], function(err) {
        done(err);
      });
    });

    it('does create new admin if authorized as admin', function(done) {
      request(app).post('/api/users').type('json').set('token', adminToken)
        .send(UserFactory.attributes({ role: 'admin' }))
        .expect(200, done);
    });
  });

  describe('GET api/users', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
    it('is not accessible for customer');
    it('does return user list if authorized as admin', function(done) {
      request(app).get('/api/users').set('token', adminToken)
        .expect(200, done);
    });
  });

  describe('GET /api/users/self', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
  });

  describe('PUT /api/users/self', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
  });

  describe('GET /api/users/token', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via token auth');
  });

  describe('GET /api/users/:id', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
    it('is not accessible for customer');
  });

  describe('PUT /api/users/:id', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
    it('is not accessible for customer');
  });

  describe('DELETE /api/users/:id', function() {
    it('is not accessible for unauthenticated user');
    it('is not accessible via basic http auth');
    it('is not accessible for customer');
    it('can not delete last admin from database');
  });

  after(function(done) {
    mongoose.disconnect(done);
  });
});

