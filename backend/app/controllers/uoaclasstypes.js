var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    UnitOfAnalysisClassType = require('app/models/uoaclasstypes'),
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisClassType.select(UnitOfAnalysisClassType.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var uoaClassType = thunkQuery(UnitOfAnalysisClassType.select(), req.query);
            return yield [_counter, uoaClassType];
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
            var _counter = thunkQuery(UnitOfAnalysisClassType.select(UnitOfAnalysisClassType.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var langId = yield * detectLanguage(req);
            var uoaClassType = thunkQuery(getTranslateQuery(langId, UnitOfAnalysisClassType));
            return yield [_counter, uoaClassType];
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
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysisClassType, UnitOfAnalysisClassType.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisClassType.insert(req.body).returning(UnitOfAnalysisClassType.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'insert',
                object: 'UnitOfAnalysisClassType',
                entity: _.first(data).id,
                info: 'Add new uoa class type'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisClassType.update(req.body).where(UnitOfAnalysisClassType.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'update',
                object: 'UnitOfAnalysisClassType',
                entity: req.params.id,
                info: 'Update uoa class type'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisClassType.delete().where(UnitOfAnalysisClassType.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'delete',
                object: 'UnitOfAnalysisClassType',
                entity: req.params.id,
                info: 'Delete uoa class type'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
