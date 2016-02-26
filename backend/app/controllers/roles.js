var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    // tables
    Role = require('app/models/roles');

var co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {

        req.query.realm = req.param('realm');

        co(function* () {
            return yield thunkQuery(Role.select().from(Role), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },
    selectOne: function (req, res, next) {
        query(Role.select().where(_.pick(req.params, ['id'])), {
            'realm': req.param('realm')
        }, function (err, role) {
            if (!err) {
                res.json(_.first(role));
            } else {
                next(err);
            }
        });
    },
    insertOne: function (req, res, next) {
        req.query.realm = req.param('realm');

        query(Role.insert(req.body).returning(Role.id),
            _.omit(req.query, 'offset', 'limit', 'order'),
            function (err, data) {
                if (!err) {
                    res.status(201).json(_.first(data));
                } else {
                    next(err);
                }
            });
    },
    updateOne: function (req, res, next) {
        req.query.realm = req.param('realm');

        query(
            Role.update(req.body).where(Role.id.equals(req.params.id)),
            _.omit(req.query, 'offset', 'limit', 'order'),
            function (err, data) {
                if (!err) {
                    res.status(202).end();
                } else {
                    next(err);
                }
            }
        );
    },
};
