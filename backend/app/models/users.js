var vl = require('validator'),
    async = require('async'),
    HttpError = require('app/error').HttpError,
    config = require('config'),
    crypto = require('crypto'),
    _ = require('underscore'),
    util = require('util');

var debug = require('debug')('debug_models_users');
debug.log = console.log.bind(console);

var sql = require('sql');

var columns = [
    'id',
    'firstName',
    'email',
    'lastName',
    'salt',
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
    'isAnonymous',
    'langId'
];

var viewFields = [
    'id',
    'firstName',
    'email',
    'lastName',
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
    'organization',
    'usergroupId',
    'rights',
    'projectId',
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
    columns: columns
});

User.hashPassword = function (salt, password) {
    var hash = crypto.createHash('sha256');
    if (salt){
        hash.update(util.format('%s+%s+%s', config.auth.salt, salt, password));
    } else {
        hash.update(util.format('%s+%s', config.auth.salt, password));
    }
    var temp = hash.digest('hex');
    hash = crypto.createHash('sha256');
    hash.update(temp);
    return hash.digest('hex');
};

User.validPassword = function (pas, salt, checkpas) {
    return pas === this.hashPassword(salt, checkpas);
};

User.editCols = [
    'firstName', 'lastName', 'phone', 'birthday', 'password',
    'updated', 'timezone','location','cell','address',
    'lang','bio','notifyLevel','affiliation'
];

User.translate = [
    'firstName',
    'lastName',
    'address',
    'affiliation',
    'location'
];

User.view = function(user){
    return _.pick(user, viewFields);
};

User.sesInfo = [
    'id', 'firstName', 'lastName', 'role', 'email',
    'roleID', 'rights', 'organizationId',
    'projectId', 'password', 'salt', 'realmUserId'
];

User.whereCol = columns;

module.exports = User;
