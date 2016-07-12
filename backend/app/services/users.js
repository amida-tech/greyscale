var
    _ = require('underscore'),
    User = require('app/models/users'),
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
            var result = yield thunkQuery(User.select().where(User.id.equals(id)));
            return result[0] || false;
        });
    };

};

module.exports = exportObject;