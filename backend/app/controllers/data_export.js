var Product = require('app/models/products'),
    DataApiKey = require('app/models/data_api_keys'),
    products = require('app/controllers/products'),
    co = require('co'),
    _ = require('underscore'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    HttpError = require('app/error').HttpError;

module.exports = {
    // simple api key auth
    // TODO: consider upgrading to use passport
    authenticate: function (req, res, next) {

        co(function* () {
            var keyString = req.param('api_key', null);
            if (keyString === null) {
                throw new HttpError(401, 'API key required');
            }

            var key = (yield thunkQuery(
                DataApiKey
                .select(
                    DataApiKey.organizationId
                )
                .where(
                    DataApiKey.key.equals(keyString)
                )
            ))[0];
            if (!key) {
                throw new HttpError(401, 'Invalid API key');
            }

            req.organizationId = key.organizationId;
        }).then(function () {
            next();
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.id,
                    Product.title
                )
                .from(Product)
                .where(Product.organizationId.equals(req.organizationId))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var productId = parseInt(req.params.id);
        co(function* () {
            // check product belongs to organization
            var product = (yield thunkQuery(
                Product
                .select(
                    Product.id
                )
                .from(Product)
                .where(
                    Product.id.equals(productId).and(Product.organizationId.equals(req.organizationId))
                )
            ))[0];
            if (!product) {
                throw new HttpError(404, 'Invalid dataset id');
            }

            return yield products.calcAggregateIndexes(req, productId, true);
        }).then(function (result) {
            result.data = result.agg;
            delete result.agg;
            result.questions = result.questions.map(function (question) {
                return _.pick(question, ['id', 'title']);
            });

            res.json(result);
        }, function (err) {
            next(err);
        });
    }

};
