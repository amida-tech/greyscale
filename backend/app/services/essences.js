var
    Essence = require('../models/attachments'),
    co = require('co'),
    Query = require('../util').Query,
    thunkify = require('thunkify');

var exportObject = function (req, realm) {

    var thunkQuery;

    if (realm) {
        thunkQuery = thunkify(new Query(realm));
    } else {
        thunkQuery = req.thunkQuery;
    }

    this.getById = function (id) {
        return co(function* () {
            return yield thunkQuery(Essence.select().where(Essence.id.equals(id)));
        });
    };

    this.getEssenceModel = function (filename) {
        try {
            var model = require('../models/' + filename);
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
