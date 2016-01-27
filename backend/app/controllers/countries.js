var _ = require('underscore'),
    User = require('app/models/users'),
    Country = require('app/models/countries'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
    	req.query.realm = req.param('realm');
    	
        co(function* () {
            var _counter = thunkQuery(Country.select(Country.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var country = thunkQuery(Country.select(), req.query);
            return yield [_counter, country];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {   	
            return yield thunkQuery(Country.insert(req.body).returning(Country.id), {'realm': req.param('realm')});
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Country.update(req.body).where(Country.id.equals(req.body.id)), {'realm': req.param('realm')});
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Country.delete().where(Country.id.equals(req.query.id)),{'realm': req.param('realm')});
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
