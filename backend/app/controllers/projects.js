var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
  Project = require('app/models/projects'),
  AccessMatrix = require('app/models/access_matrices'),
  Translation = require('app/models/translations'),
  Language = require('app/models/languages'),
  Essence = require('app/models/essences'),
  Organization = require('app/models/organizations'),
  User = require('app/models/users'),
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
      return yield thunkQuery(Project.select().from(Project));
    }).then(function(data){
      res.json(data);
    },function(err){
      next(err);
    })
  },

  selectOne: function (req, res, next) {
    co(function* (){
      var project =  yield thunkQuery(Project.select().from(Project).where(Project.id.equals(req.params.id)));
      if (!_.first(project)) {
        throw new HttpError(404, 'Not found');
      }else{
        console.log(_.first(project));
        return _.first(project);
      }
    }).then(function(data){
      res.json(data);
    },function(err){
      next(err);
    })
  },

  delete: function (req, res, next) {
    var q = Project.delete().where(Project.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  },

editOne: function (req, res, next) {

    co(function* () {
        var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
        if (!_.first(isExistMatrix)) {
            throw new HttpError(403, 'Matrix with this id does not exist');
        }

        var isExistOrg = yield thunkQuery(Organization.select().where(Organization.id.equals(req.body.organizationId)));
        if (!_.first(isExistOrg)) {
            throw new HttpError(403, 'Organization with this id does not exist');
        }

        var isExistAdmin = yield thunkQuery(User.select().where(User.id.equals(req.body.adminUserId)));
        if (!_.first(isExistAdmin)) {
            throw new HttpError(403, 'User with this id does not exist (admin user id)');
        }

        var result = yield thunkQuery(Project.update(req.body).where(Project.id.equals(req.params.id)));

        return result;
    }).then(function () {
        res.status(202).end();
    }, function (err) {
        next(err);
    });

},

  insertOne: function (req, res, next) {

    co(function* () {
      var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
      if (!_.first(isExistMatrix)) {
          throw new HttpError(403, 'Matrix with this id does not exist');
      }

      var isExistOrg = yield thunkQuery(Organization.select().where(Organization.id.equals(req.body.organizationId)));
      if (!_.first(isExistOrg)) {
          throw new HttpError(403, 'Organization with this id does not exist');
      }

      var isExistAdmin = yield thunkQuery(User.select().where(User.id.equals(req.body.adminUserId)));
      if (!_.first(isExistAdmin)) {
          throw new HttpError(403, 'User with this id does not exist (admin user id)');
      }

      // req.body.originalLangId = req.lang.id;
      var result = yield thunkQuery(Project.insert(req.body).returning(Project.id));

      return result;
    }).then(function (data) {
      res.status(201).json(_.first(data));
    }, function (err) {
      next(err);
    });

  }

};
