var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    // tables
    Role = require('app/models/roles');

var co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        //var q = Role.select().from(Role);
        //console.log('query',query)
        //query(q, function (err, data) {
        //  if (err) {
        //    return next(err);
        //  }
        //  res.json(data);
        //});

        co(function* () {
            return yield thunkQuery(Role.select().from(Role), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },
    selectOne: function (req, res, next) {
        query(Role.select().where(_.pick(req.params, ['id'])), function (err, role) {
            if (!err) {
                res.json(_.first(role));
            } else {
                next(err);
            }
        });
    },
    insertOne: function (req, res, next) {
        query(Role.insert(req.body).returning(Role.id),
            function (err, data) {
                if (!err) {
                    bologger.log({
                        user: req.user.id,
                        action: 'insert',
                        object: 'roles',
                        entity: _.first(data).id,
                        info: 'Add new role'
                    });
                    res.status(201).json(_.first(data));
                } else {
                    next(err);
                }
            });
    },
    updateOne: function (req, res, next) {
        query(
            Role.update(req.body).where(Role.id.equals(req.params.id)),
            function (err, data) {
                if (!err) {
                    bologger.log({
                        user: req.user.id,
                        action: 'update',
                        object: 'roles',
                        entity: req.params.id,
                        info: 'Update role'
                    });
                    res.status(202).end();
                } else {
                    next(err);
                }
            }
        );
    }
};
