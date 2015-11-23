var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
  Product = require('app/models/products'),
  AccessMatrix = require('app/models/access_matrices'),
  co = require('co'),
  Query = require('app/util').Query,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);

module.exports = {

  select: function (req, res, next) {
    var q = Product.select().from(Product);
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(data);
    });
  },

  delete: function (req, res, next) {
    var q = Product.delete().where(Product.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  },

  insertOne: function (req, res, next) {

    co(function* () {
      var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
      if (!_.first(isExistMatrix)) {
          throw new HttpError(403, 'Matrix with this id does not exist');
      }
    
      var result = yield thunkQuery(Product.insert(req.body).returning(Product.id));

      return result;
    }).then(function (data) {
      res.status(201).json(_.first(data));
    }, function (err) {
      next(err);
    });

  }

};
