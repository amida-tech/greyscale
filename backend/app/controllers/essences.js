var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
  Essence = require('app/models/essences');

var co = require('co');
var Query = require('app/util').Query,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);

module.exports = {

  select: function (req, res, next) {
    var q = Essence.select().from(Essence);
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(data);
    });
  },

  insertOne: function (req, res, next) {

    co(function* () {
      var isExists = yield thunkQuery(Essence.select().where(Essence.label.equals(req.body.label)));
      if (_.first(isExists)) {
          throw new HttpError(403, 107);
      }
    
      var result = yield thunkQuery(Essence.insert(req.body).returning(Essence.id));

      return result;
    }).then(function (data) {
      res.status(201).json(_.first(data));
    }, function (err) {
      next(err);
    });


  }

};
