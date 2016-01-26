var _ = require('underscore'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
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

    selectOne: function (req, res, next) {
        var q = Organization.select().from(Organization).where(Organization.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                next(new HttpError(404, 'Not found'));
            }
        });
    },

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Organization.select().from(Organization), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        co(function* () {
            if (!req.body.adminUserId) {
                throw new HttpError(400, 'Admin user id field is required');
            }
            var existUser = yield thunkQuery(User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId)));
            if (!_.first(existUser)) {
                throw new HttpError(403, 'User with this id does not exist');
            }
            return yield thunkQuery(Organization.insert(req.body).returning(Organization.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    }

};
