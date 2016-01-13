var _ = require('underscore'),
    RoleRights = require('app/models/role_rights'),
    Roles = require('app/models/roles'),
    Rights = require('app/models/rights'),
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
        co(function* () {
            var _counter = thunkQuery(RoleRights.select(RoleRights.count('counter')).where(req.params), _.omit(req.query, 'offset', 'limit', 'order'));
            var roleRight = thunkQuery(RoleRights.select(Rights.star()).from(RoleRights.leftJoin(Rights).on(RoleRights.rightID.equals(Rights.id))).where(req.params), req.query);

            return yield [_counter, roleRight];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },
    insertOne: function (req, res, next) {
        co(function* () {
            var isExists = yield thunkQuery(RoleRights.select().where(req.params));
            if (_.first(isExists)) {
                throw new HttpError(403, 106);
            }

            var Right = yield thunkQuery(Rights.select().where(Rights.id.equals(req.params.rightID)));
            if (!_.first(Right)) {
                throw new HttpError(400, 'This right does not exist');
            }

            var Role = yield thunkQuery(Roles.select().where(Roles.id.equals(req.params.roleID)));
            Role = _.first(Role);

            if (!Role) {
                throw new HttpError(400, 'This role does not exist');
            }

            if (Role && !Role.isSystem) {
                throw new HttpError(400, 'You can add right only to system roles. For simple roles use access matrices');
            }

            var result = yield thunkQuery(RoleRights.insert(req.params));

            return result;
        }).then(function (data) {
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },
    deleteOne: function (req, res, next) {
        query(
            RoleRights.delete().where(req.params),
            function (err) {
                if (!err) {
                    res.status(204).end();
                } else {
                    next(err);
                }
            });
    },

};
