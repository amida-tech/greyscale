var _ = require('underscore'),
    RequestLoggerMixin = require('lib/request_logger_mixin'),
    util = require('util'),
    diff_json = require('diff-json')

function Logger(winstonLogger) {
    this.wlogger = winstonLogger;
}

Logger.prototype.initialize = function (req, res, next) {
    var logger = this;

    return function (req, res, next) {
        _.extend(req, (new RequestLoggerMixin(logger)).logger.wlogger);
        req.debug(util.format('%s %s', req.method, req.path), {
            method: req.method,
            path: req.path,
            headers: req.headers
        });
        next();
    };
};

Logger.prototype.debug = function (msg, meta) {
    if (meta) {
        this.wlogger.log('debug', msg, meta);
    } else {
        this.wlogger.log('debug', msg);
    }
};

Logger.prototype.info = function (msg, meta) {
    if (meta) {
        this.wlogger.log('info', msg, valid_meta(meta));
    } else {
        this.wlogger.log('info', msg);
    }
};

Logger.prototype.error = function (msg, meta) {
    if (meta) {
        this.wlogger.log('error', msg, meta);
    } else {
        this.wlogger.log('error', msg);
    }
};

function valid_meta(m) {
    //m.user = m.user ? _.pick(m.user.toObject(), '_id', 'email', 'role', 'name') : null;
    //m.before = m.before || null;
    //m.after = m.after || null;
    //m.documentID = m.before && m.before._id || m.after && m.after._id;
    //m.documentID = m.documentID == 'object' ? m.documentID : new ObjectId(m.documentID);
    //m.diff = diff_json.diff(_.omit(m.before || {}, '_id', '__v'), _.omit(m.after || {}, '_id', '__v'));
    return m;
}

module.exports = Logger;
