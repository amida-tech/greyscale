var _ = require('underscore'),
    Visualization = require('app/models/visualizations'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {
    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(Visualization.select());
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            /*if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }*/
            if (
                typeof req.body.title === 'undefined' ||
                typeof req.body.productId === 'undefined' ||
                typeof req.body.topicIds === 'undefined' ||
                typeof req.body.indexCollection === 'undefined' ||
                typeof req.body.indexId === 'undefined' ||
                typeof req.body.visualizationType === 'undefined'
            ) {
                throw new HttpError(403, 'title, productId, topicIds, indexCollection, indexId and visualizationType fields are required');
            }
            var objToInsert = _.pick(req.body,
                ['title', 'productId', 'topicIds', 'indexCollection', 'indexId', 'visualizationType', 'comparativeTopicId']
            );
            return yield thunkQuery(Visualization.insert(objToInsert).returning(Visualization.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            /*if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot update visualizations from other organizations');
            }*/
            if (
                typeof req.body.title === 'undefined' ||
                typeof req.body.productId === 'undefined' ||
                typeof req.body.topicIds === 'undefined' ||
                typeof req.body.indexCollection === 'undefined' ||
                typeof req.body.indexId === 'undefined' ||
                typeof req.body.visualizationType === 'undefined'
            ) {
                throw new HttpError(403, 'title, productId, topicIds, indexCollection, indexId and visualizationType fields are required');
            }
            var objToUpdate = _.pick(req.body,
                ['title', 'productId', 'topicIds', 'indexCollection', 'indexId', 'visualizationType', 'comparativeTopicId']
            );
            return yield thunkQuery(Visualization.update(objToUpdate).where(Visualization.id.equals(req.params.id)));
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                Visualization.delete().where(Visualization.id.equals(req.params.id))
            );
            return result;
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                Visualization.select().where(Visualization.id.equals(req.params.id))
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
