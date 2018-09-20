var
    _ = require('underscore'),
    config = require('../config'),
    common = require('./services/common'),
    debug = require('debug')('bologger'),
    vl = require('validator'),
    Essence = require('./models/essences'),
    User = require('./models/users'),
    Log = require('./models/logs'),
    co = require('co'),
    thunkify = require('thunkify'),
    Query = require('./util').Query,
    sql = require('sql'),
    query = new Query(),
    thunkQuery = thunkify(query);

function BoLogger() {
    this.data = {};
}

BoLogger.prototype.init = function* (object, req) {
    this.data.essence = yield common.getEssenceId(req, object);
};

BoLogger.prototype.extend = function (data) {
    if (typeof data.entity === 'undefined') {
        delete this.data.entity;
    }
    if (typeof data.entities === 'undefined') {
        delete this.data.entities;
    }
    if (typeof data.quantity === 'undefined') {
        delete this.data.quantity;
    }
    this.data = (_.extend(this.data, _.pick(data, Log.insertCols)));
};

BoLogger.prototype.log = function (data) {
    co.call(this, function* () {
        //data.essence = yield * common.getEssenceId(data.object);
        if (data.object) {
            yield this.init(data.object, data.req);
        }
        if (typeof data.entities === 'object') {
            data.entities = JSON.stringify(data.entities);
        }
        var thunkQuery = (data.req) ? data.req.thunkQuery : thunkify(new Query(config.pgConnect.adminSchema));

        if (data.user) {
            data.userid = (data.user.roleID === 1) ? 0 - data.user.id : data.user.id; // if superuser - then user = -id
        }
        this.extend(data);
        var id = yield thunkQuery(Log.insert(this.data).returning(Log.id));
        return data;
    }).then(function (data) {
        // next();
    }, function (err) {
        debug(err);
    });

};
BoLogger.prototype.error = function (data, result) {
    this.log(_.extend(data, {
        error: true,
        result: result
    }));
};

var getEssenceId = function* (essenceName) {
    return yield thunkQuery(Essence.select().from(Essence).where([sql.functions.UPPER(Essence.name).equals(essenceName.toUpperCase())]));
};

module.exports = BoLogger;
