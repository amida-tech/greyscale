var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    AccessMatrix = require('app/models/access_matrices'),
    AccessPermission = require('app/models/access_permissions'),
    Right = require('app/models/rights'),
    Role = require('app/models/roles');

var co = require('co');
var Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var q = AccessMatrix.select().from(AccessMatrix);
        query(q, {
            'realm': req.param('realm')
        }, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            if (!req.body.name) {
                throw new HttpError(403, 'Name field is required');
            }
            return yield thunkQuery(AccessMatrix.insert(req.body).returning(AccessMatrix.id), {
                'realm': req.param('realm')
            });
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    permissionsSelect: function (req, res, next) {
        var q = AccessPermission.select().from(AccessPermission).where(AccessPermission.matrixId.equals(req.params.id));
        query(q, {
            'realm': req.param('realm')
        }, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    },

    permissionsDeleteOne: function (req, res, next) {
        var q = AccessPermission.delete().where(AccessPermission.id.equals(req.params.id));
        query(q, {
            'realm': req.param('realm')
        }, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    permissionsInsertOne: function (req, res, next) {
        co(function* () {
            var existMatrix = yield thunkQuery(AccessMatrix.select().from(AccessMatrix).where(AccessMatrix.id.equals(req.body.matrixId)), {
                'realm': req.param('realm')
            });
            if (!_.first(existMatrix)) {
                throw new HttpError(403, 'Matrix with this id does not exist');
            }

            var existRole = yield thunkQuery(Role.select().from(Role).where(Role.id.equals(req.body.roleId)), {
                'realm': req.param('realm')
            });
            if (!_.first(existRole)) {
                throw new HttpError(403, 'Role with this id does not exist');
            }

            var existRight = yield thunkQuery(Right.select().from(Right).where(Right.id.equals(req.body.rightId)), {
                'realm': req.param('realm')
            });
            if (!_.first(existRight)) {
                throw new HttpError(403, 'Right with this id does not exist');
            }

            return yield thunkQuery(AccessPermission.insert(req.body).returning(AccessPermission.id), {
                'realm': req.param('realm')
            });
        }).then(function (data) {
            console.log(_.first(data));
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    }

};
