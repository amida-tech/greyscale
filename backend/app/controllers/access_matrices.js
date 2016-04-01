var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
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

var debug = require('debug')('debug_access_matrices');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var q = AccessMatrix.select().from(AccessMatrix);
        query(q, function (err, data) {
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
            return yield thunkQuery(AccessMatrix.insert(req.body).returning(AccessMatrix.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'insert',
                object: 'AccessMatrices',
                entity: _.first(data).id,
                info: 'Add new access matrice permission'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    permissionsSelect: function (req, res, next) {
        var q = AccessPermission.select().from(AccessPermission).where(AccessPermission.matrixId.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    },

    permissionsDeleteOne: function (req, res, next) {
        var q = AccessPermission.delete().where(AccessPermission.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'delete',
                object: 'AccessPermissions',
                entity: req.params.id,
                info: 'Delete access permission'
            });
            res.status(204).end();
        });
    },

    permissionsInsertOne: function (req, res, next) {
        co(function* () {
            var existMatrix = yield thunkQuery(AccessMatrix.select().from(AccessMatrix).where(AccessMatrix.id.equals(req.body.matrixId)));
            if (!_.first(existMatrix)) {
                throw new HttpError(403, 'Matrix with this id does not exist');
            }

            var existRole = yield thunkQuery(Role.select().from(Role).where(Role.id.equals(req.body.roleId)));
            if (!_.first(existRole)) {
                throw new HttpError(403, 'Role with this id does not exist');
            }

            var existRight = yield thunkQuery(Right.select().from(Right).where(Right.id.equals(req.body.rightId)));
            if (!_.first(existRight)) {
                throw new HttpError(403, 'Right with this id does not exist');
            }

            return yield thunkQuery(AccessPermission.insert(req.body).returning(AccessPermission.id));
        }).then(function (data) {
            debug(_.first(data));
            bologger.log({
                req: req,
                user: req.user.realmUserId,
                action: 'insert',
                object: 'AccessPermissions',
                entity: _.first(data).id,
                info: 'Insert access permission'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    }

};
