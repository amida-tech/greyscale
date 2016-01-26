var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    UnitOfAnalysis = require('app/models/uoas'),
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

    selectOrigLanguage: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysis.select(UnitOfAnalysis.count('counter')));
            var uoa = thunkQuery(UnitOfAnalysis.select(), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoa];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysis.select(UnitOfAnalysis.count('counter')));
            var langId = yield * detectLanguage(req);
            var uoa = thunkQuery(getTranslateQuery(langId, UnitOfAnalysis), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoa];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysis, UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            req.body.creatorId = req.user.id;
            req.body.ownerId = req.user.id;
            req.body.createTime = new Date();
            return yield thunkQuery(UnitOfAnalysis.insert(req.body).returning(UnitOfAnalysis.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            delete req.body.createTime;
            return yield thunkQuery(UnitOfAnalysis.update(req.body).where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysis.delete().where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
