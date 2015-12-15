var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
  Product = require('app/models/products'),
  AccessMatrix = require('app/models/access_matrices'),
  Translation = require('app/models/translations'),
  Language = require('app/models/languages'),
  Essence = require('app/models/essences'),
  co = require('co'),
  Query = require('app/util').Query,
  getTranslateQuery = require('app/util').getTranslateQuery,
  detectLanguage = require('app/util').detectLanguage,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);

module.exports = {

  select: function (req, res, next) {
    co(function* (){
      var langId = yield* detectLanguage(req);
      return yield thunkQuery(getTranslateQuery(langId, Product));
    }).then(function(data){
      res.json(data);
    },function(err){
      next(err);
    })
  },

  selectOne: function (req, res, next) {
    var q = getTranslateQuery(req, Product, Product.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(_.first(data));
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
