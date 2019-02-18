var
    Attachment = require('../models/attachments'),
    AttachmentLink = require('../models/attachment_links'),
    config = require('../../config'),
    co = require('co'),
    Query = require('../util').Query,
    thunkify = require('thunkify'),
    AWS = require('aws-sdk');
AWS.config.update(config.aws);
var s3 = new AWS.S3();

var exportObject = function (req, realm) {

    var thunkQuery;

    if (realm) {
        thunkQuery = thunkify(new Query(realm));
    } else {
        thunkQuery = req.thunkQuery;
    }

    this.getList = function () {
        return co(function* () {
            return thunkQuery(Attachment.select().from(Attachment), req.query);
        });
    };

    this.getLinksContainAttachment = function (attachmentId) {
        return co(function* () {
            return yield thunkQuery(
                'SELECT * FROM "AttachmentLinks" WHERE "attachments" @> ARRAY[' + parseInt(attachmentId) + ']'
            );
        });
    };

    this.updateLinkArray = function (essenceId, entityId, attArr) {
        return co(function* () {
            if (!Array.isArray(attArr)) {
                throw new Error('You should provide an array of attachment ids');
            }

            yield thunkQuery(
                AttachmentLink
                .update({
                    attachments: attArr
                }).where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                )
            );
        });
    };

    this.removeLink = function (essenceId, entityId) {
        return co(function* () {
            yield thunkQuery(
                AttachmentLink.delete().where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                )
            );
        });
    };

    this.addLink = function (oLink) {
        return co(function* () {
            yield thunkQuery(AttachmentLink.insert(oLink));
        });

    };

    this.getLink = function (essenceId, entityId) {
        return co(function* () {
            return yield thunkQuery(
                AttachmentLink
                .select()
                .where(
                    AttachmentLink.essenceId.equals(essenceId)
                    .and(AttachmentLink.entityId.equals(entityId))
                )
            );
        });
    };

    this.getById = function (id) {
        return co(function* () {
            return yield thunkQuery(Attachment.select().where(Attachment.id.equals(id)));
        });
    };

    this.add = function (oAttachment) {
        return co(function* () {
            return yield thunkQuery(Attachment.insert(oAttachment).returning(Attachment.id));
        });
    };

    this.remove = function (id) {
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
            s3.deleteObject(params, (err) => {
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
            ContentDisposition: 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(name)
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
};

module.exports = exportObject;
