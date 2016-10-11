var
    _ = require('underscore'),
    Attachment = require('app/models/attachments'),
    AttachmentAttempts = require('app/models/attachment_attempts'),
    AttachmentLink = require('app/models/attachment_links'),
    config = require('config'),
    co = require('co'),
    sql = require('sql'),
    Query = require('app/util').Query,
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    AWS = require('aws-sdk');
    AWS.config.update(config.aws);
    var s3 = new AWS.S3();

var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getList = function () {
        return co(function* () {
            return yield thunkQuery(Attachment.select().from(Attachment), req.query);
        });
    };

    this.getLinksContainAttachment = function (attachmentId) {
        return co(function* () {
            return yield thunkQuery(
                'SELECT * FROM "AttachmentLinks" WHERE "attachments" @> ARRAY[' + parseInt(attachmentId) + ']'
            );
        });
    };

    this.updateLinkArray = function (essenceId, entityId, attArr, version) {
        return co(function* () {
            if (!Array.isArray(attArr)) {
                throw new Error('You should provide an array of attachment ids');
            }

            var query = AttachmentLink
                .update({
                    attachments: attArr
                }).where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                );

            if (typeof version !== 'undefined') {
                query = query.where({version : version});
            }

            yield thunkQuery(query);
        });
    };

    this.removeLink = function (essenceId, entityId, version) {
        return co(function* (){
            var query = AttachmentLink
                .delete()
                .where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                );

            if (typeof version !== 'undefined') {
                query = query.where({version : version});
            }

            yield thunkQuery(query);
        });
    };

    this.addLink = function (oLink) {
        return co(function* (){
            yield thunkQuery(AttachmentLink.insert(oLink));
        });

    };

    this.getLink = function (essenceId, entityId, version) {
        return co(function* () {
            var query = AttachmentLink
                .select()
                .where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                );

            if (typeof version !== 'undefined') {
                query = query.where({version : version});
            }

            return yield thunkQuery(query);
        });
    };

    this.getEntityAttachments = function (essenceId, entityId, version) {
        return co(function* () {
            var query = AttachmentLink
                .select(
                    Attachment.star()
                )
                .from(
                    AttachmentLink
                    .leftJoin(Attachment)
                    .on(sql.array(AttachmentLink.attachments).contains(sql.array(Attachment.id)))
                )
                .where(
                    AttachmentLink.essenceId.equals(essenceId)
                        .and(AttachmentLink.entityId.equals(entityId))
                );

            if (typeof version !== 'undefined') {
                query = query.where({version : version});
            }

            return yield thunkQuery(query);
        });
    };

    this.getById = function(id) {
        return co(function* () {
            return yield thunkQuery(Attachment.select().where(Attachment.id.equals(id)));
        });
    };

    this.add = function(oAttachment) {
        return co(function* (){
            return yield thunkQuery(Attachment.insert(oAttachment).returning(Attachment.id));
        });
    };

    this.remove = function(id) {
        var self = this;
        return co(function* () {
            var attachment = yield self.getById(id);
            if (!attachment.length) {
                throw new Error('Attachment with this id does not exist');
            }
            yield thunkQuery(Attachment.delete().where(Attachment.id.equals(id)));
            yield self._removeFromAws(attachment[0].amazonKey);
        });
    };

    this._removeFromAws = function (key) {
        return new Promise((resolve, reject) => {
            var params = {
                Bucket: config.awsBucket,
                Key: key
            };
            s3.deleteObject(params, (err, data) => {
                if (err) {
                    reject({
                        error: err
                    }); // an error occurred
                } else {
                    resolve({
                        error: null
                    }); // successful response
                }
            });
        });
    };

    this.getAWSUploadLink = function (key, type, name) {
        var params = {
            Bucket: config.awsBucket,
            Key: key,
            Expires: 3600000, // TODO move to config ??
            ContentType: type,
            ContentDisposition: "attachment; filename*=UTF-8''" + encodeURIComponent(name)
        };
        return s3.getSignedUrl('putObject', params);
    };

    this.getAWSDownloadLink = function (key) {
        var params = {
            Bucket: config.awsBucket,
            Key: key
        };
        return s3.getSignedUrl('getObject', params);
    };

    this.getObject = function (key) {
        var params = {
            Bucket: config.awsBucket,
            Key: key
        };
        return new Promise((resolve, reject) => {
            s3.getObject(params, function (error, data) {
                if (error != null) {
                    console.log("Failed to retrieve an object: " + error);
                    reject(error);
                } else {
                    console.log("Loaded " + data.ContentLength + " bytes");
                    resolve(data);
                }
            });
        });

    }

    this.addAttempt = function (oAttempt) {
        return co(function* () {
            return yield thunkQuery(AttachmentAttempts.insert(oAttempt).returning(AttachmentAttempts.key));
        });
    };

    this.getAttemptByKey = function (key) {
        return co(function* () {
            return yield thunkQuery(AttachmentAttempts.select().where(AttachmentAttempts.key.equals(key)));
        });
    };

    this.removeAttempt = function (key) {
        return co(function* () {
            return yield thunkQuery(AttachmentAttempts.delete().where(AttachmentAttempts.key.equals(key)));
        });
    };
};

module.exports = exportObject;
