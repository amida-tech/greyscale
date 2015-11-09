var _ = require('underscore'),
  Right = require('app/models/rights'),
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
      var _counter = thunkQuery(Right.select(Right.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
      var right = thunkQuery(Right.select(), req.query);

      return yield [_counter, right];
    }).then(function (data) {
      res.set('X-Total-Count', _.first(data[0]).counter);
      res.json(_.last(data));
    }, function (err) {
      next(err);
    });
  },

  insertOne: function (req, res, next) {
    query(Right.insert(req.body).returning(Right.id),
      function (err, data) {
        if (!err) {
          res.status(201).json(_.first(data));
        }
        else {
          next(err);
        }
      });
  },

  selectOne: function (req, res, next) {
    query(Right.select().where(req.params), function (err, user) {
      if (!err) {
        res.json(_.first(user));
      } else {
        next(err);
      }
    });
  },

  updateOne: function (req, res, next) {
    query(
      Right.update(req.body).where(Right.id.equals(req.params.id)),
      function (err, data) {
        if (!err) {
          res.status(202).end();
        } else {
          next(err);
        }
      }
    );
  },

  deleteOne: function (req, res, next) {
    query(
      Right.delete().where(Right.id.equals(req.params.id)),
      function (err) {
        if (!err) {
          res.status(204).end();
        } else {
          next(err);
        }
      });
  }
};

