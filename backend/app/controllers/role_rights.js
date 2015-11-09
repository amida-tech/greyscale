var _ = require('underscore'),
  Role_rights = require('app/models/role_rights'),
  Rights = require('app/models/rights'),
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
      var _counter = thunkQuery(Role_rights.select(Role_rights.count('counter')).where(req.params), _.omit(req.query, 'offset', 'limit', 'order'));
      var role_right = thunkQuery(Role_rights.select(Rights.star()).from(Role_rights.leftJoin(Rights).on(Role_rights.rightID.equals(Rights.id))).where(req.params), req.query)
      ;

      return yield [_counter, role_right];
    }).then(function (data) {
      res.set('X-Total-Count', _.first(data[0]).counter);
      res.json(_.last(data));
    }, function (err) {
      next(err);
    });
  },
  insertOne: function (req, res, next) {
    co(function* () {
      var isExists = yield thunkQuery(Role_rights.select().where(req.params));
      if (_.first(isExists)) {
          throw new HttpError(403, 106);
      }
    
      var result = yield thunkQuery(Role_rights.insert(req.params));

      return result;
    }).then(function (data) {
      res.status(201).end();
    }, function (err) {
      next(err);
    });

  },
  deleteOne: function (req, res, next) {
    query(
      Role_rights.delete().where(req.params),
      function (err) {
        if (!err) {
          res.status(204).end();
        } else {
          next(err);
        }
      });
  },
  
  
};

