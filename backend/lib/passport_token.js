var passport = require('passport'),
    util = require('util'),
    logger = require('app/logger');

function Strategy(options, verify) {
    if (typeof options == 'function') {
        verify = options;
        options = {};
    }
    if (!verify) throw new Error('Token strategy requires a verify function');

    this._tokenHeader = options.tokenHeader || 'token';

    passport.Strategy.call(this);
    this.name = 'token';
    this._verify = verify;
    this._passReqToCallback = options.passReqToCallback;
}

util.inherits(Strategy, passport.Strategy);

Strategy.prototype.authenticate = function (req, options) {
    options = options || {};
    var token = lookup(req.headers, this._tokenHeader);

    if (!token) {
        var msg = 'Token not found when trying to authenticate';
        req.debug(msg);
        return this.fail(new Error(options.badRequestMessage || msg));
    }

    var self = this;

    function verified(err, user, info) {
        if (err) {
            return self.error(err);
        }
        if (!user) {
            return self.fail(info);
        }
        self.success(user, info);
    }

    if (self._passReqToCallback) {
        this._verify(req, token, verified);
    } else {
        this._verify(token, verified);
    }

    function lookup(obj, field) {
        if (!obj) {
            return null;
        }
        var chain = field.split(']').join('').split('[');
        for (var i = 0, len = chain.length; i < len; i++) {
            var prop = obj[chain[i]];
            if (typeof (prop) === 'undefined') {
                return null;
            }
            if (typeof (prop) !== 'object') {
                return prop;
            }
            obj = prop;
        }
        return null;
    }
};

module.exports = Strategy;
