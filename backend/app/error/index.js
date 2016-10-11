var util = require('util'),
    http = require('http'),
    errCode = require('app/error/err_code');

var debug = require('debug')('debug_errorHandler');
var error = require('debug')('error');
debug.log = console.log.bind(console);

function HttpError(status, err, httpStatus) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);
    var errNumber = (err && typeof err === 'number' ? true : false);

    this.status = httpStatus ? httpStatus : 400;
    this.message = {
        'e': (errNumber ? err : this.status),
        'message': (errNumber && errCode[err] ? errCode[err] : err || http.STATUS_CODES[status] || 'Error')
    };
}

util.inherits(HttpError, Error);

HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;

function DbError(err, httpStatus) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, DbError);

    this.status = httpStatus ? httpStatus : 400;

    // parse db error message
    debug('Error message: '+err.message);
    debug('Error details: '+err.detail);
    var mesArr = [];
    var key;

    switch (err.code) {
        // Class 23 — Integrity Constraint Violation
        case '23503': // foreign_key_violation
            mesArr = err.message.split('"');
            if (mesArr && mesArr.length === 7) {
                key = ((typeof mesArr[1] === 'string') ? mesArr[1].toUpperCase() : '') +
                    '_HAS_' +
                    ((typeof mesArr[5] === 'string') ? mesArr[5].toUpperCase() : '') +
                    '_' +
                    ((typeof mesArr[3] === 'string') ? ((typeof mesArr[3].split('_')[1] === 'string') ? mesArr[3].split('_')[1].toUpperCase() : '') : '');
            } else {
                key = err.message;
            }
            break;
        case '23505': // unique_violation
            mesArr = err.message.split('"');
            if (mesArr && mesArr.length === 3) {
                key = (typeof mesArr[1] === 'string') ? mesArr[1].toUpperCase() : '';
            } else {
                key = err.message;
            }
            break;
        default:
            key = err.message;
        }


    this.message = {
        'e': err.code,
        'message': key
    };
}

util.inherits(DbError, Error);

DbError.prototype.name = 'DbError';

exports.DbError = DbError;
