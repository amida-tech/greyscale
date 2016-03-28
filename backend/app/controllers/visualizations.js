var _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Visualization = require('app/models/visualizations'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {
    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(Visualization.select().where(
                Visualization.organizationId.equals(req.params.organizationId)
            ));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }

            var objToInsert = _.pick(req.body,
                ['title', 'productId', 'topicIds', 'indexCollection', 'indexId', 'visualizationType', 'comparativeTopicId']
            );
            objToInsert.organizationId = req.params.organizationId;
            return yield thunkQuery(Visualization.insert(objToInsert).returning(Visualization.id));
        }).then(function (data) {
            bologger.log({
                user: req.user.id,
                action: 'insert',
                object: 'visualizations',
                entity: _.first(data).id,
                info: 'Add new visualization'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }

            var objToUpdate = _.pick(req.body,
                ['title', 'productId', 'topicIds', 'indexCollection', 'indexId', 'visualizationType', 'comparativeTopicId']
            );
            return yield thunkQuery(Visualization.update(objToUpdate).where(
                Visualization.id.equals(req.params.id).and(Visualization.organizationId.equals(req.params.organizationId))
            ));
        }).then(function () {
            bologger.log({
                user: req.user.id,
                action: 'update',
                object: 'visualizations',
                entity: req.params.id,
                entities: {
                    organizationId: req.params.organizationId
                },
                quantity: 1,
                info: 'Update visualization'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                Visualization.delete().where(
                    Visualization.id.equals(req.params.id).and(Visualization.organizationId.equals(req.params.organizationId))
                )
            );
            return result;
        }).then(function (data) {
            bologger.log({
                user: req.user.id,
                action: 'delete',
                object: 'visualizations',
                entity: req.params.id,
                entities: {
                    organizationId: req.params.organizationId
                },
                quantity: 1,
                info: 'Delete visualization'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                Visualization.select().where(
                    Visualization.id.equals(req.params.id).and(Visualization.organizationId.equals(req.params.organizationId))
                )
            );
            if (!result[0]) {
                throw new HttpError(404, 'Not found');
            }
            return result[0];
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }
};
