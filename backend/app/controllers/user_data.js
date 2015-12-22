var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
  UserData = require('app/models/user_data'),
  co = require('co'),
  Query = require('app/util').Query,
  getTranslateQuery = require('app/util').getTranslateQuery,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);

module.exports = {

  select: function (req, res, next) {
    var q = UserData.select().from(UserData);
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(data);
    });
  },

  selectOne: function (req, res, next) {
    var q = UserData.select().from(UserData).where(UserData.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(_.first(data));
    });
  },

  delete: function (req, res, next) {
    var q = UserData.delete().where(UserData.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  },

  editOne: function (req, res, next) {
    var q = UserData.update(req.body).where(UserData.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(202).end();
    });
  },

  insertOne: function (req, res, next) {
    var q = UserData.insert(req.body).returning(UserData.id);
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(201).json(_.first(data));
    });
  }

};
