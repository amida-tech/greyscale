var _ = require('underscore'),
    config = require('../../config'),
    Essence = require('../models/essences'),
    co = require('co'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(Essence.select().from(Essence), _.omit(req.query, 'offset', 'limit'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            if (!req.body.tableName || !req.body.name || !req.body.fileName || !req.body.nameField) {
                throw new HttpError(403, 'tableName, name, fileName and nameField fields are required');
            }

            var isExists = yield thunkQuery(
                Essence
                .select()
                .where(
                    Essence.tableName.equals(req.body.tableName)
                    .or(Essence.fileName.equals(req.body.fileName))
                )
            );

            if (_.first(isExists)) {
                throw new HttpError(403, 'record with this tableName or(and) fileName has already exist');
            }

            var model;
            try {
                model = require('../models/' + req.body.fileName);
            } catch (err) {
                throw new HttpError(403, 'Cannot find model file: ' + req.body.fileName);
            }

            if (model.table._initialConfig.columns.indexOf(req.body.nameField) === -1) {
                throw new HttpError(403, 'Essence does not have \"' + req.body.nameField + '\" field');
            }

            var result = yield thunkQuery(Essence.insert(req.body).returning(Essence.id));

            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },
    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield thunkQuery(
                Essence.delete().where(Essence.id.equals(req.params.id))
            );
        }).then(function (data) {
            // ToDo: add Bologger
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    }

};
