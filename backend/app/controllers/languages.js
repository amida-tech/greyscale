var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    Language = require('app/models/languages'),
    co = require('co'),
    Query = require('app/util').Query,
    getTranslateQuery = require('app/util').getTranslateQuery,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Language.select().from(Language)
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var data = yield thunkQuery(
                Language.select().from(Language).where(Language.id.equals(req.params.id))
            );
            if (!data.length) {
                throw new HttpError(404, 'Not found');
            }
            return data;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Language.delete().where(Language.id.equals(req.params.id))
            );
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    editOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Language.update(req.body).where(Language.id.equals(req.params.id))
            );
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Language.insert(req.body).returning(Language.id)
            );
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    }

};
