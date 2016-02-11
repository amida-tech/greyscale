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
    'mobile',
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
    'cell',
    'address',
    'lang',
    'bio',
    'notifyLevel'
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
    'firstName', 'lastName', 'mobile', 'birthday', 'updated',
    'timezone','location','cell','address','lang','bio','notifyLevel'
];
User.sesInfo = ['id', 'firstName', 'lastName', 'role', 'email', 'roleID', 'rights', 'organizationId'];
User.whereCol = columns;

module.exports = User;
