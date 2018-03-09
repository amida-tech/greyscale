var _ = require('underscore'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    UnitOfAnalysisTag = require('../models/uoatags'),
    UnitOfAnalysisTagLink = require('../models/uoataglinks'),
    co = require('co'),
    Query = require('../util').Query,
    getTranslateQuery = require('../util').getTranslateQuery,
    detectLanguage = require('../util').detectLanguage,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError;

module.exports = {

    selectOrigLanguage: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.count('counter')));
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.count('counter')));
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysisTag, UnitOfAnalysisTag.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTag.insert(req.body).returning(UnitOfAnalysisTag.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UnitOfAnalysisTag',
                entity: _.first(data).id,
                info: 'Add new uoa tag'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTag.update(req.body).where(UnitOfAnalysisTag.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'UnitOfAnalysisTag',
                entity: req.params.id,
                info: 'Update uoa tag'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(UnitOfAnalysisTagLink.select().where(UnitOfAnalysisTagLink.uoaTagId.equals(req.params.id)));
            if (_.first(result)) {
                throw new HttpError(403, 'Tag used in Subject to Tag link. Could not delete Tag');
            }
            return yield thunkQuery(UnitOfAnalysisTag.delete().where(UnitOfAnalysisTag.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UnitOfAnalysisTag',
                entity: req.params.id,
                info: 'Delete uoa tag'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
