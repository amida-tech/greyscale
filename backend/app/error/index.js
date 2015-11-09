var util = require('util'),
  http = require('http'),
  err_code = require('app/error/err_code');

function HttpError(status, err) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, HttpError);
  var err_number = (err && typeof err == 'number' ? true : false);

  this.status = status;
  this.message = {
    "!": 0,
    "e": (err_number ? err : this.status),
    "message": (err_number && err_code[err] ? err_code[err] : err || http.STATUS_CODES[status] || 'Error')
  };
}

util.inherits(HttpError, Error);

HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;