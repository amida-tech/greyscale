var Product = require('app/models/products'),
    products = require('app/controllers/products'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.id,
                    Product.title
                )
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
            return yield products.calcAggregateIndexes(productId, true);
        }).then(function (result) {
            result.data = result.agg;
            delete result.agg;
            res.json(result);
        }, function (err) {
            next(err);
        });
    }

};
