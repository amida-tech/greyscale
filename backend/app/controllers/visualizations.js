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
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
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
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                Visualization.delete().where(
                    Visualization.id.equals(req.params.id).and(Visualization.organizationId.equals(req.params.organizationId))
                )
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
