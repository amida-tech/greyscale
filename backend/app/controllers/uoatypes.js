var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    UnitOfAnalysisType = require('app/models/uoatypes'),
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

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisType.select(UnitOfAnalysisType.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            //var langId = yield * detectLanguage(req);
            //var uoaType = thunkQuery(getTranslateQuery(langId, UnitOfAnalysisType));
            var uoaType = thunkQuery(
                UnitOfAnalysisType
                .select()
                .where(UnitOfAnalysisType.name.notEquals(config.pgConnect.policyUoaType))
            );
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
            //return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysisType, UnitOfAnalysisType.id.equals(req.params.id)));
            return yield thunkQuery(
                UnitOfAnalysisType
                .select()
                .where(UnitOfAnalysisType.id.equals(req.params.id))
            );
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
