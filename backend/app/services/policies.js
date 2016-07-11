var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    co = require('co'),
    HttpError = require('app/error').HttpError;


var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getById = function (id) {
        return co(function* () {
           return thunkQuery(Policy.select().where(Policy.id.equals(id)));
        });
    };

    this.setEditor = function (id, userId) { // for safety, have to do separate update method
        return co(function* () {
            return yield thunkQuery(Policy.update({editor: userId}).where(Policy.id.equals(id)));
        });
    };
}

module.exports = exportObject;