var uuid = require('node-uuid');

function RequestLoggerMixin(logger) {
    this.logger = logger;
}

// Request id used to group log entries by requests
RequestLoggerMixin.prototype.getRequestId = function () {
    if (!this.requestId) {
        this.requestId = uuid.v1();
    }
    return this.requestId;
};

// Add request related metadata to log entry
RequestLoggerMixin.prototype.addMetadata = function (meta) {
    if (!meta) {
        meta = {};
    }
    meta.requestId = this.getRequestId();
    return meta;
};

RequestLoggerMixin.prototype.debug = function (msg, meta) {
    this.logger.debug(msg, this.addMetadata(meta));
};

RequestLoggerMixin.prototype.info = function (msg, meta) {
    this.logger.info(msg, this.addMetadata(meta));
};

RequestLoggerMixin.prototype.error = function (msg, meta) {
    this.logger.error(msg, this.addMetadata(meta));
};

module.exports = RequestLoggerMixin;
