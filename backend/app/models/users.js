var vl = require('validator'),
    async = require('async'),
    HttpError = require('app/error').HttpError,
    config = require('config'),
    crypto = require('crypto'),
    util = require('util');

var sql = require('sql');

var columns = [
    'id',
    'firstName',
    'email',
    'lastName',
    'password',
    'roleID',
    'cell',
    'birthday',
    'resetPasswordToken',
    'resetPasswordExpires',
    'created',
    'updated',
    'isActive',
    'activationToken',
    'organizationId',
    'timezone',
    'location',
    'phone',
    'address',
    'lang',
    'bio',
    'notifyLevel',
    'lastActive',
    'affiliation',
    'isAnonymous'
];

var User = sql.define({
    name: 'Users',
    schema: 'proto_amida',
    columns: columns
});

User.hashPassword = function (password) {
    var hash = crypto.createHash('sha256');
    hash.update(util.format('%s+%s', config.auth.salt, password));
    var temp = hash.digest('hex');
    hash = crypto.createHash('sha256');
    hash.update(temp);
    return hash.digest('hex');
};

User.validPassword = function (pas, checkpas) {
    return pas === this.hashPassword(checkpas);
};

User.editCols = [
    'firstName', 'lastName', 'phone', 'birthday',
    'updated', 'timezone','location','cell','address',
    'lang','bio','notifyLevel','affiliation'
];

User.sesInfo = ['id', 'firstName', 'lastName', 'role', 'email', 'roleID', 'rights', 'organizationId'];
User.whereCol = columns;

module.exports = User;
