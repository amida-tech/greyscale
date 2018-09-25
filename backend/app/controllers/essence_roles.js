var _ = require('underscore'),
    config = require('../../config'),
    EssenceRole = require('../models/essence_roles'),
    Essence = require('../models/essences'),
    Role = require('../models/roles'),
    User = require('../models/users');

var co = require('co');
var Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_essence_roles');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var q = EssenceRole.select(EssenceRole.star());
            var from = EssenceRole;
            if (req.query.essenceId) {
                var essence = yield thunkQuery(
                    Essence.select().where(Essence.id.equals(req.query.essenceId))
                );
                if (essence[0]) {
                    debug(essence[0]);
                    var Model;
                    try {
                        Model = require('../models/' + essence[0].fileName);
                    } catch (e) {
                        throw new HttpError(403, 'Cannot load model\'s file: ' + essence[0].fileName);
                    }
                    from = from.leftJoin(Model).on(EssenceRole.entityId.equals(Model.id));
                    q = q.select('row_to_json("' + Model.table._name + '".*) as entity');
                } else {
                    throw new HttpError(403, 'Entity type with id = ' + req.query.essenceId + ' does not exist');
                }
            }

            return yield thunkQuery(
                q.from(from), _.omit(req.query, 'limit', 'offset', 'order')
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
                EssenceRole.select().from(EssenceRole).where(EssenceRole.id.equals(req.params.id))
            );
            if (!_.first(data)) {
                return next(new HttpError(404, 'Not found'));
            }
            return data;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkData(req);
            return yield thunkQuery(EssenceRole.update(req.body).where(EssenceRole.id.equals(req.params.id)));
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                EssenceRole.delete().where(EssenceRole.id.equals(req.params.id))
            );
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkData(req);
            return yield thunkQuery(EssenceRole.insert(req.body).returning(EssenceRole.id));
        }).then(function (data) {
            debug(_.first(data));
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

};

function* checkData(req) {
    var thunkQuery = req.thunkQuery;
    var existEssence = yield thunkQuery(Essence.select().from(Essence).where(Essence.id.equals(req.body.essenceId)));
    if (!_.first(existEssence)) {
        throw new HttpError(403, 'Essence with this id does not exist (' + req.body.essenceId + ')');
    }

    var model;
    try {
        model = require('../models/' + _.first(existEssence).fileName);
    } catch (err) {
        throw new HttpError(403, 'Cannot find model file: ' + _.first(existEssence).fileName);
    }

    var existEntity = yield thunkQuery(model.select().from(model).where(model.id.equals(req.body.entityId)));
    if (!_.first(existEntity)) {
        throw new HttpError(403, 'Entity with this id does not exist (' + req.body.entityId + ')');
    }

    var existRole = yield thunkQuery(Role.select().from(Role).where(Role.id.equals(req.body.roleId)));
    if (!_.first(existRole)) {
        throw new HttpError(403, 'Role with this id does not exist');
    }

    var existUser = yield thunkQuery(User.select().from(User).where(User.id.equals(req.body.userId)));
    if (!_.first(existUser)) {
        throw new HttpError(403, 'User with this id does not exist');
    }
}
