var _ = require('underscore'),
    Group = require('../models/groups'),
    UserGroup = require('../models/user_groups'),
    vl = require('validator'),
    HttpError = require('../error').HttpError,
    util = require('util'),
    async = require('async'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Query = require('../util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    selectByOrg: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== parseInt(req.params.organizationId))) {
                throw new HttpError(400, 'You cannot view groups from other organizations');
            }
            var result = yield thunkQuery(
                Group.select(
                    Group.star(),
                    'array_agg("UserGroups"."userId") as "userIds"'
                )
                .from(
                    Group
                    .leftJoin(UserGroup)
                    .on(Group.id.equals(UserGroup.groupId))
                )
                .where(Group.organizationId.equals(req.params.organizationId))
                .group(Group.id)
            );
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== parseInt(req.params.organizationId))) {
                throw new HttpError(400, 'You cannot post groups to other organizations');
            }
            if (!req.body.title) {
                throw new HttpError(400, 'Title is required');
            }
            if (!req.body.users || req.body.users.length === 0) {
                throw new HttpError(400, 'Requires an array of userIds');
            }
            var objToInsert = {
                organizationId: req.params.organizationId,
                title: req.body.title
            };
            var groupResult = yield thunkQuery(Group.insert(objToInsert).returning(Group.id));

            var groupId = _.first(groupResult).id;
            var insertArr = _.map(req.body.users, (userId) => ({userId, groupId}));
            yield thunkQuery(UserGroup.insert(insertArr));

            return groupResult;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== req.body.organizationId)) {
                throw new HttpError(400, 'You cannot update groups from other organizations');
            }
            if (!req.body.title) {
                throw new HttpError(400, 'Title is required');
            }
            var objToUpdate = {
                title: req.body.title
            };
            return yield thunkQuery(Group.update(objToUpdate).where(Group.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                Group.delete().where(Group.id.equals(req.params.id))
            );
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                Group.select().where(Group.id.equals(req.params.id))
            );
            if (!result[0]) {
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
