var _ = require('underscore'),
    Group = require('app/models/groups'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    //select: function (req, res, next) {
    //    co(function* () {
    //        var _counter = thunkQuery(Right.select(Right.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
    //        var right = thunkQuery(Right.select(), req.query);
    //
    //        return yield [_counter, right];
    //    }).then(function (data) {
    //        res.set('X-Total-Count', _.first(data[0]).counter);
    //        res.json(_.last(data));
    //    }, function (err) {
    //        next(err);
    //    });
    //},

    selectByOrg: function (req, res, next) {
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot view groups from other organizations');
            }
            var result = yield thunkQuery(
                Group.select().where(Group.organizationId.equals(req.params.organizationId))
            );
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot post groups to other organizations');
            }
            if (!req.body.title) {
                throw new HttpError(400, 'Title is required');
            }
            var objToInsert = {
                organizationId : req.params.organizationId,
                title : req.body.title
            };
            return yield thunkQuery(Group.insert(objToInsert).returning(Group.id));
        }).then(function (data) {
            bologger.log({
                user: req.user.id,
                action: 'insert',
                object: 'groups',
                entity: _.first(data).id,
                info: 'Add new group'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.body.organizationId)) {
                throw new HttpError(400, 'You cannot update groups from other organizations');
            }
            if (!req.body.title) {
                throw new HttpError(400, 'Title is required');
            }
            var objToUpdate = {
                title : req.body.title
            };
            return yield thunkQuery(Group.update(objToUpdate).where(Group.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                user: req.user.id,
                action: 'update',
                object: 'groups',
                entity: req.params.id,
                info: 'Update group'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                Group.delete().where(Group.id.equals(req.params.id))
            );
            return result;
        }).then(function (data) {
            bologger.log({
                user: req.user.id,
                action: 'delete',
                object: 'groups',
                entity: req.params.id,
                info: 'Delete group'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                Group.select().where(Group.id.equals(req.params.id))
            );
            if(!result[0]){
                throw new HttpError(404, 'Not found');
            }
            return result[0];
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }
};
