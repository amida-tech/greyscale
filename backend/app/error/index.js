var util = require('util'),
    http = require('http'),
    errCode = require('./err_code');

function HttpError(status, err) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);
    var errNumber = (err && typeof err === 'number' ? true : false);
    this.status = status;
    this.message = {
        '!': 0,
        'e': (errNumber ? err : this.status),
        'message': (errNumber && errCode[err] ? errCode[err] : err || http.STATUS_CODES[status] || 'Error')
    };
}

util.inherits(HttpError, Error);

HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;
