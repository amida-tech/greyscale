var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    EssenceRole = require('app/models/essence_roles'),
    Essence = require('app/models/essences'),
    Role = require('app/models/roles'),
    User = require('app/models/users');

var co = require('co');
var Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
        	req.query.realm = req.param('realm');
            return yield thunkQuery(EssenceRole.select().from(EssenceRole), _.omit(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var q = EssenceRole.select().from(EssenceRole).where(EssenceRole.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            if (!_.first(data)) {
                return next(new HttpError(404, 'Not found'));
            }
            res.json(_.first(data));
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            yield * checkData(req);
            return yield thunkQuery(EssenceRole.update(req.body).where(EssenceRole.id.equals(req.params.id)),
            		 {'realm': req.param('realm')});
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var q = EssenceRole.delete().where(EssenceRole.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkData(req);
            return yield thunkQuery(EssenceRole.insert(req.body).returning(EssenceRole.id),
            		{'realm': req.param('realm')});
        }).then(function (data) {
            console.log(_.first(data));
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

};

function* checkData(req) {
    var existEssence = yield thunkQuery(Essence.select().from(Essence).where(Essence.id.equals(req.body.essenceId)),
    		 {'realm': req.param('realm')});
    if (!_.first(existEssence)) {
        throw new HttpError(403, 'Essence with this id does not exist (' + req.body.essenceId + ')');
    }

    var model;
    try {
        model = require('app/models/' + _.first(existEssence).fileName);
    } catch (err) {
        throw new HttpError(403, 'Cannot find model file: ' + _.first(existEssence).fileName);
    }

    var existEntity = yield thunkQuery(model.select().from(model).where(model.id.equals(req.body.entityId)),
    		 {'realm': req.param('realm')});
    if (!_.first(existEntity)) {
        throw new HttpError(403, 'Entity with this id does not exist (' + req.body.entityId + ')');
    }

    var existRole = yield thunkQuery(Role.select().from(Role).where(Role.id.equals(req.body.roleId)),
    		 {'realm': req.param('realm')});
    if (!_.first(existRole)) {
        throw new HttpError(403, 'Role with this id does not exist');
    }

    var existUser = yield thunkQuery(User.select().from(User).where(User.id.equals(req.body.userId)),
    		 {'realm': req.param('realm')});
    if (!_.first(existUser)) {
        throw new HttpError(403, 'User with this id does not exist');
    }
}
