var
    _ = require('underscore'),
    ProductUOA = require('../models/product_uoa'),
    taskServ = require('../services/tasks'),
    co = require('co'),
    HttpError = require('../error').HttpError;

exportObject = {
    deleteProductUOA: function (req, productId, UOAid) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
                var tasks = yield taskServ.getByProductUOA(req, productId, UOAid);
                if (tasks.length) {
                    throw new HttpError(403, 'You cannot delete this target, because there are already some tasks in it');
                }
                yield thunkQuery(
                    ProductUOA.delete().where({
                        productId: productId,
                        UOAid: UOAid
                    })
                );
            }).then(function () {
                resolve(true);
            }, function (err) {
                reject(err);
            });
        });
    }
}

module.exports = exportObject;
