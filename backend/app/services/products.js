var
    _ = require('underscore'),
    ProductUOA = require('app/models/product_uoa'),
    Product = require('app/models/products'),
    sTask = require('app/services/tasks'),
    co = require('co'),
    HttpError = require('app/error').HttpError;

var exportObject = function (req, realm) {
    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.deleteProductUOA = function (productId, UOAid) {
        return co(function* () {
            var oTask = new sTask(req);
            var tasks = yield oTask.getByProductUOA(productId, UOAid);
            if (tasks.length) {
                throw new HttpError(403, 'You cannot delete this target, because there are already some tasks in it');
            }
            yield thunkQuery(
                ProductUOA.delete().where({
                    productId: productId,
                    UOAid: UOAid
                })
            );
        });
    }

    this.getProductsBySurvey = function (surveyId) {
        return co(function* () {
           return yield thunkQuery(Product.select().where(Product.surveyId.equals(surveyId)));
        });
    }
}

module.exports = exportObject;
