var _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    HttpError = require('app/error').HttpError,
    co = require('co'),
    fs = require('fs'),
    common = require('app/services/common'),
    sAttachment = require('app/services/attachments'),
    sEssence = require('app/services/essences'),
    crypto = require('crypto');


module.exports = {
    select: function (req, res, next) {
        var oAttachment = new sAttachment(req);
        oAttachment.getList().then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    links: function (req, res, next) {
        var oAttachment = new sAttachment(req);
        var oEssence = new sEssence(req);
        co(function* () {
            if (!req.params.essenceId || !req.params.entityId) {
                throw new HttpError(400, 'You should provide essence id and entity id');
            }

            if (!Array.isArray(req.body)) {
                throw new HttpError(404, 'You should provide an array of attachments id in request body');
            }

            for (var i in req.body) {
                var attachment = yield oAttachment.getById(req.body[i]);
                if (!attachment.length) {
                    throw new HttpError(404, 'Attachment with id = ' + req.body[i] + ' does not exist');
                }
            }

            var essence = yield oEssence.getById(req.params.essenceId);
            if (!essence.length) {
                throw new HttpError(400, 'Essence with id = ' + req.params.essenceId + 'does not exist');
            }

            var model = yield oEssence.getEssenceModel(essence[0].fileName);
            if (!model) {
                throw new HttpError(400, 'Cannot load essence model file');
            }

            var entity = yield oEssence.getEntityById(model, req.params.entityId);
            if (!entity.length) {
                throw new HttpError(400, essence[0].name + ' with id = ' + req.params.entityId + ' does not exist');
            }

            yield oAttachment.updateLinkArray(req.params.essenceId, req.params.entityId, req.body);
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    getTicket: function (req, res, next) {
        var oAttachment = new sAttachment(req);
        co(function* () {
            var attachment = yield oAttachment.getById(req.params.id);
            if (!attachment[0]) {
                throw new HttpError(404, 'Attachment not found');
            }

            if (attachment[0].amazonKey) {
                return {
                    url: oAttachment.getAWSDownloadLink(attachment[0].amazonKey)
                };
            } else {
                throw new HttpError(404, 'Attachment not found on remote server');
            }

        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    uploadSuccess: function (req, res, next) {
        var oAttachment = new sAttachment(req);
        var oEssence = new sEssence(req);
        co(function* () {
            if (!req.body.key) {
                throw new HttpError(400, 'You should provide key');
            }

            var attempt = yield oAttachment.getAttemptByKey(req.body.key);
            if (!attempt.length) {
                throw new HttpError(400, 'Key is not valid');
            }

            var attachment = {
                filename: attempt[0].filename,
                size: attempt[0].size,
                mimetype: attempt[0].mimetype,
                owner: req.user.realmUserId,
                amazonKey: req.body.key
            };

            var id = yield oAttachment.add(attachment);
            var linked = false;
            if (req.body.essenceId && req.body.entityId) {
                var essence = yield oEssence.getById(req.body.essenceId);
                if (!essence.length) {
                    throw new HttpError(400, 'Essence with id = ' + req.body.essenceId + 'does not exist');
                }

                var model = yield oEssence.getEssenceModel(essence[0].fileName);
                if (!model) {
                    throw new HttpError(400, 'Cannot load essence model file');
                }

                var entity = yield oEssence.getEntityById(model, req.body.entityId);
                if (!entity.length) {
                    throw new HttpError(400, essence[0].name + ' with id = ' + req.body.entityId + ' does not exist');
                }

                var link = {
                    essenceId: req.body.essenceId,
                    entityId: req.body.entityId,
                    attachments: [id[0].id]
                };

                // if exists update, else insert
                var existLink = yield oAttachment.getLink(req.body.essenceId, req.body.entityId);
                if (existLink.length) {
                    existLink[0].attachments.push(id[0].id);
                    yield oAttachment.updateLinkArray(req.body.essenceId, req.body.entityId, existLink[0].attachments);
                } else {
                    yield oAttachment.addLink(link);
                }

                linked = true;
            }

            yield oAttachment.removeAttempt(req.body.key);
            return {
                id: id[0].id,
                linked: linked
            };
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    getUploadLink: function (req, res, next) {
        var oAttachment = new sAttachment(req);
        co(function* () {
            if (!req.body.type || !req.body.size || !req.body.name) {
                throw new HttpError(400, 'You should provide file name, size and type');
            }
            var key = req.params.realm + '/' + crypto.randomBytes(16).toString('hex');
            var url = oAttachment.getAWSUploadLink(key, req.body.type, req.body.name);

            var attempt = {
                key: key,
                filename: req.body.name,
                mimetype: req.body.type,
                size: req.body.size
            };
            yield oAttachment.addAttempt(attempt);
            return {
                url: url,
                key: key
            };

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) { // TODO check right
        var oAttachment = new sAttachment(req);
        co(function* () {
            if (!req.params.essenceId || !req.params.entityId || !req.params.id) {
                throw new HttpError(400, 'You should provide attachment id, essence Id and entity Id');
            }

            var version = req.params.version ? req.params.version : 0;

            var attachment = yield oAttachment.getById(req.params.id);

            if (!attachment.length) {
                throw new HttpError(404, 'Attachment with id = ' + req.params.id + ' does not exist');
            } else {
                var records = yield oAttachment.getLinksContainAttachment(req.params.id);
                if (!records.length) {
                    yield oAttachment.remove(req.params.id);
                    return;
                }
            }

            var link = yield oAttachment.getLink(req.params.essenceId, req.params.entityId, version);

            if (!link.length) {
                throw new HttpError(400, 'Entity does not have any attachment link');
            }

            var attIndex = -1;

            if (Array.isArray(link[0].attachments)) {
                attIndex = link[0].attachments.indexOf(parseInt(req.params.id));
            }

            if (attIndex === -1) {
                throw new HttpError(400, 'Entity does not link with this attachment id');
            }

            link[0].attachments.splice(attIndex, 1); // remove attachment from links

            if (link[0].attachments.length) { // update attachments array
                yield oAttachment.updateLinkArray(req.params.essenceId, req.params.entityId, link[0].attachments, version);
            } else { // attachments link empty, remove record
                yield oAttachment.removeLink(req.params.essenceId, req.params.entityId, version);
            }

            // check for another records with this attachment id
            var records = yield oAttachment.getLinksContainAttachment(req.params.id);
            if (!records.length) {
                yield oAttachment.remove(req.params.id);
            }

        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'attachments',
                entity: req.params.id,
                info: 'Delete attachment'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
