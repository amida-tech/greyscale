var
    _ = require('underscore'),
    Essence = require('app/models/essences'),
    config = require('config'),
    co = require('co'),
    Query = require('app/util').Query,
    thunkify = require('thunkify');

var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getById = function (id) {
        return co(function* () {
            return yield thunkQuery(Essence.select().where(Essence.id.equals(id)));
        });
    };

    this.getByTableName = function (tableName) {
        return co(function* () {
            return (yield thunkQuery(Essence.select().where(Essence.tableName.equals(tableName))))[0] || false;
        });
    };

    this.getEssenceModel = function (filename) {
        try {
            var model = require('app/models/' + filename);
            return model;
        } catch (err) {
            return false;
        }
    };

    this.getEntityById = function (modelObject, id) {
        return co(function* () {
            yield thunkQuery(modelObject.select().where(modelObject.id.equals(id)));
        });
    };

};

module.exports = exportObject;
