var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
        	req.query.realm = req.param('realm');
            return yield thunkQuery(Survey.select().from(Survey), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var q = Survey.select().from(Survey).where(Survey.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                return next(new HttpError(404, 'Not found'));
            }

        });
    },

    delete: function (req, res, next) {
        var q = Survey.delete().where(Survey.id.equals(req.params.id));
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    editOne: function (req, res, next) {
        if (req.body.data) {
            var q = Survey.update(req.body).where(Survey.id.equals(req.params.id));
            query(q,  {'realm': req.param('realm')}, function (err, data) {
                if (err) {
                    return next(err);
                }
                res.status(202).end();
            });
        } else {
            return next(new HttpError(400, 'No data to update'));
        }
    },

    insertOne: function (req, res, next) {
        var q = Survey.insert(req.body).returning(Survey.id);
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(201).json(_.first(data));
        });
    }

};
