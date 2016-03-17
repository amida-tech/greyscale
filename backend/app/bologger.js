var
    _ = require('underscore'),
    config = require('config'),
    common = require('app/queries/common'),
    logger = require('app/logger'),
    vl = require('validator'),
    Essence = require('app/models/essences'),
    User = require('app/models/users'),
    Log = require('app/models/logs'),
    co = require('co'),
    thunkify = require('thunkify'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkQuery = thunkify(query);


function BoLogger() {
}

BoLogger.prototype.log = function (data) {
    co(function* () {
        console.log(data);
        data.essence = yield * common.getEssenceId(data.object);
        var id = yield thunkQuery(Log.insert(_.pick(data, Log.insertCols)).returning(Log.id));
        return data;
    }).then(function (data) {
        next();
    }, function (err) {
        logger.error(err);
    });

};

module.exports = BoLogger;
