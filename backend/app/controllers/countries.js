var _ = require('underscore'),
  User = require('app/models/users'),
  Country = require('app/models/countries'),
  vl = require('validator'),
  HttpError = require('app/error').HttpError,
  util = require('util'),
  async = require('async'),
  Query = require('app/util').Query,
  query = new Query(),
  co = require('co'),
  thunkify = require('thunkify'),
  thunkQuery = thunkify(query);


module.exports = {

  select: function (req, res, next) {
    co(function* () {
      var _counter = thunkQuery(Country.select(Country.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
      var country = thunkQuery(Country.select(), req.query);
      return yield [_counter, country];
    }).then(function (data) {
      res.set('X-Total-Count', _.first(data[0]).counter);
      res.json(_.last(data));
    }, function (err) {
      next(err);
    });
  },
  insertOne: function (req, res, next) {
    co(function* (){
      if(!req.body.adminUserId){
        throw new HttpError(400, 'Admin user id field is required');
      }
      var existUser = yield thunkQuery(User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId)));
      if(!_.first(existUser)){
        throw new HttpError(403, 'User with this id does not exist');
      }
      return yield thunkQuery(Country.insert(req.body).returning(Country.id));
    }).then(function(data){
      res.status(201).json(_.first(data));
    },function(err){
      next(err);
    });
    
  }

};

