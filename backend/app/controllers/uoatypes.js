var _ = require('underscore'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    UnitOfAnalysisType = require('../models/uoatypes'),
    UnitOfAnalysis = require('../models/uoas'),
    co = require('co'),
    Query = require('../util').Query,
    getTranslateQuery = require('../util').getTranslateQuery,
    detectLanguage = require('../util').detectLanguage,
    HttpError = require('../error').HttpError;

module.exports = {

    selectOrigLanguage: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisType.select(UnitOfAnalysisType.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var uoaType = thunkQuery(UnitOfAnalysisType.select(), req.query);
            return yield [_counter, uoaType];
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
            var _counter = thunkQuery(UnitOfAnalysisType.select(UnitOfAnalysisType.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var langId = yield * detectLanguage(req);
            var uoaType = thunkQuery(getTranslateQuery(langId, UnitOfAnalysisType));
            return yield [_counter, uoaType];
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
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysisType, UnitOfAnalysisType.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisType.insert(req.body).returning(UnitOfAnalysisType.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UnitOfAnalysisType',
                entity: _.first(data).id,
                info: 'Add new uoa type'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisType.update(req.body).where(UnitOfAnalysisType.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'UnitOfAnalysisType',
                entity: req.params.id,
                info: 'Update uoa type'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(UnitOfAnalysis.select().where(UnitOfAnalysis.unitOfAnalysisType.equals(req.params.id)));
            if (_.first(result)) {
                throw new HttpError(403, 'Subject with this type exists. Could not delete subject type');
            }
            return yield thunkQuery(UnitOfAnalysisType.delete().where(UnitOfAnalysisType.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UnitOfAnalysisType',
                entity: req.params.id,
                info: 'Delete uoa type'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
