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
    sql = require('sql'),
    query = new Query(),
    thunkQuery = thunkify(query);


function BoLogger() {
    this.data = {};
}

BoLogger.prototype.init = function* (object) {
    this.data.essence = yield common.getEssenceId(object);
};

BoLogger.prototype.extend = function (data) {
    if (typeof data.entity === 'undefined'){
        delete this.data.entity;
    }
    if (typeof data.entities === 'undefined'){
        delete this.data.entities;
    }
    this.data = (_.extend(this.data, _.pick(data, Log.insertCols)));
};

BoLogger.prototype.log = function (data) {
    co.call(this, function* () {
        //data.essence = yield * common.getEssenceId(data.object);
        if (data.object) {
            yield this.init(data.object);
        }
        if (typeof data.entities === 'object') {
            data.entities = JSON.stringify(data.entities);
        }
        this.extend(data);
        var id = yield thunkQuery(Log.insert(this.data).returning(Log.id));
        return data;
    }).then(function (data) {
        next();
    }, function (err) {
        logger.error(err);
    });

};
BoLogger.prototype.error = function (data, result) {
    this.log(_.extend(data, {error: true, result: result}));
};

var getEssenceId = function* (essenceName) {
    return yield thunkQuery(Essence.select().from(Essence).where([sql.functions.UPPER(Essence.name).equals(essenceName.toUpperCase())]));
};

module.exports = BoLogger;
