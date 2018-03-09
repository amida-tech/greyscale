var
    Task = require('../models/tasks'),
    co = require('co');

var exportObject = {
    getByProductUOA: function (req, productId, uoaId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
                return yield thunkQuery(
                    Task.select().where({
                        productId: productId,
                        uoaId: uoaId
                    })
                );
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    }
};

module.exports = exportObject;
