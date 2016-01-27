var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    UnitOfAnalysisTag = require('app/models/uoatags'),
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
        	req.query.realm = req.param('realm');
            var _counter = thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.count('counter')),
            		 {'realm': req.param('realm')});
            var uoaTag = thunkQuery(UnitOfAnalysisTag.select(), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoaTag];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {
        co(function* () {
        	req.query.realm = req.param('realm');
            var _counter = thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.count('counter')),
            		 {'realm': req.param('realm')});
            var langId = yield * detectLanguage(req);
            var uoaTag = thunkQuery(getTranslateQuery(langId, UnitOfAnalysisTag), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoaTag];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysisTag, UnitOfAnalysisTag.id.equals(req.params.id)),
            		 {'realm': req.param('realm')});
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTag.insert(req.body).returning(UnitOfAnalysisTag.id),
            		 {'realm': req.param('realm')});
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTag.update(req.body).where(UnitOfAnalysisTag.id.equals(req.params.id)),
            		 {'realm': req.param('realm')});
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTag.delete().where(UnitOfAnalysisTag.id.equals(req.params.id)),
            		 {'realm': req.param('realm')});
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
