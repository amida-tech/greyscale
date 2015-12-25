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
    co(function*(){
        if(!req.body.action){
            throw new HttpError(403, 'Action field is required');
        }
        return yield thunkQuery(Right.insert(req.body).returning(Right.id));
    }).then(function(data){
        res.status(201).json(_.first(data));
    },function(err){
        next(err);
    });

  },

  selectOne: function (req, res, next) {
    co(function*(){
        var right =  yield thunkQuery(Right.select().where(req.params));
        if(!_.first(right)){
            throw new HttpError(404, 'Not found');
        }
        return right;
    }).then(function(data){
        res.json(_.first(data));
    },function(err){
        next(err);
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

