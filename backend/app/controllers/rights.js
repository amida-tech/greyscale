var _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Right = require('app/models/rights'),
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(Right.select(Right.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var right = thunkQuery(Right.select().order(Right.id), req.query);

            return yield [_counter, right];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!req.body.action) {
                throw new HttpError(403, 'Action field is required');
            }
            return yield thunkQuery(Right.insert(req.body).returning(Right.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'rights',
                entity: _.first(data).id,
                info: 'Add new right'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var right = yield thunkQuery(Right.select().where(Right.id.equals(req.params.id)));
            if (!_.first(right)) {
                throw new HttpError(404, 'Not found');
            }
            return right;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
           return yield thunkQuery(
               Right.update(req.body).where(Right.id.equals(req.params.id))
           );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'rights',
                entity: req.params.id,
                info: 'Update right'
            });
            res.status(202).end();
        }, function(err){
            next(err);
        });

    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            yield thunkQuery(
                Right.delete().where(Right.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'rights',
                entity: req.params.id,
                info: 'Delete right'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });

    }
};
