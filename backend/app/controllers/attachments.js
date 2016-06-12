var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Attachment = require('app/models/attachments'),
    HttpError = require('app/error').HttpError,
    co = require('co'),
    fs = require('fs'),
    common = require('app/services/common'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    mc = require('app/mc_helper'),
    Essence = require('app/models/essences'),
    AttachmentAttempt = require('app/models/attachment_attempts'),
    AttachmentLink = require('app/models/attachment_links'),
    thunkQuery = thunkify(query),
    crypto = require('crypto'),
    AWS = require('aws-sdk');

AWS.config.update(config.aws);
var s3 = new AWS.S3();

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(Attachment.select().from(Attachment), req.query);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    links: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co( function* () {

            var essence, model;
            if (!req.params.essenceId || !req.params.entityId) {
                throw new HttpError(400, 'You should provide essence id and entity id');
            }

            if (!Array.isArray(req.body)) {
                throw new HttpError(404, 'You should provide an array of attachments id in request body');
            }

            for (var i in req.body) {
                var attachment = yield thunkQuery(Attachment.select().where(Attachment.id.equals(req.body[i])));
                if (!attachment.length) {
                    throw new HttpError(404, 'Attachment with id = ' + req.body[i] + ' does not exist');
                }
            }

            try{
                essence = yield common.getEssence(req, req.params.essenceId);
            }catch(err){
                throw err;
            }

            try{
                model = require('app/models/' + essence.fileName);
            }catch(err){
                throw new HttpError(404, 'Cannot find essence model file (' + essence.fileName + ')');
            }

            var entity = yield thunkQuery(
                model.select().where(model.id.equals(req.params.entityId))
            );

            if (!entity.length) {
                throw new HttpError(404, essence.name + ' with id = ' + req.params.entityId + ' does not exist');
            }

            yield thunkQuery(AttachmentLink
            .update({attachments: req.body})
            .where(
                {
                    essenceId: req.params.essenceId,
                    entityId: req.params.entityId
                }
            )
            );

        }).then( function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    getTicket: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){

            var attachment = yield thunkQuery(
                Attachment.select().where(Attachment.id.equals(req.params.id))
            );

            if (!attachment[0]) {
                throw new HttpError(404, 'Attachment not found');
            }

            if (attachment[0].amazonKey) {
                var params = { Bucket: config.awsBucket, Key: attachment[0].amazonKey };
                var url = s3.getSignedUrl('getObject', params);
                return { url: url };
            }

            var ticket = crypto.randomBytes(10).toString('hex');

            try{
                var r = yield mc.set(req.mcClient, ticket, attachment[0].id);
                return { tiсket: ticket };
            }catch(e){
                throw new HttpError(500, e);
            }

        }).then(function(data){
            res.status(201).json(data);
        }, function(err){
            next(err);
        });
    },

    getAttachment: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var id;
        co(function* (){
            try{
                id = yield mc.get(req.mcClient, req.params.ticket);
            }catch(e){
                throw new HttpError(500, e);
            }

            if(!id){
                throw new HttpError(400, 'Token is not valid');
            }

            var attachment = yield thunkQuery(
                Attachment.select().where(Attachment.id.equals(id))
            );
            if (!attachment[0]) {
                throw new HttpError(404, 'Not found');
            }
            return attachment[0];

        }).then(function(file){
            res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
            res.setHeader('Content-type', file.mimetype);
            res.send(file.body);
        }, function(err){
            next(err);
        });
        console.log('test');
    },

    uploadSuccess: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co( function* () {
            if (!req.body.key) {
                throw new HttpError(400, 'You should provide key');
            }

            var attempt = yield thunkQuery(AttachmentAttempt.select().where(AttachmentAttempt.key.equals(req.body.key)));
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

            var id = yield thunkQuery(Attachment.insert(attachment).returning(Attachment.id));
            var linked = false;

            if (req.body.essenceId && req.body.entityId) {

                var essence = yield thunkQuery(Essence.select().where(Essence.id.equals(req.body.essenceId)));

                if(!essence.length){
                    throw new HttpError(400, 'Essence with id = ' + req.body.essenceId + 'does not exist');
                }

                var model;
                try {
                    model = require('app/models/' + essence[0].fileName);
                } catch (err) {
                    throw new HttpError(400, 'Cannot load essence model file');
                }

                var entity = yield thunkQuery(model.select().where(model.id.equals(req.body.entityId)));

                if (!entity.length) {
                    throw new HttpError(400, essence[0].name + ' with id = ' + req.body.entityId + ' does not exist');
                }

                var link = {
                    essenceId: req.body.essenceId,
                    entityId: req.body.entityId,
                    attachments: [id[0].id]
                };

                // if exists update, else insert
                var existLink = yield thunkQuery(
                    AttachmentLink.select()
                    .where(
                        _.omit(link, 'attachments')
                    )
                );

                if (existLink.length) {
                    existLink[0].attachments.push(id[0].id);
                    yield thunkQuery(
                        AttachmentLink
                        .update(
                            {
                                attachments: existLink[0].attachments
                            }
                        )
                        .where(
                            _.omit(link, 'attachments')
                        )
                    );
                } else {
                    yield thunkQuery(AttachmentLink.insert(link));
                }

                linked = true;
            }

            yield thunkQuery(AttachmentAttempt.delete().where(AttachmentAttempt.key.equals(req.body.key)));

            return {
                id: id[0].id,
                linked: linked
            };

        }).then( function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    getUploadLink: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co( function* () {
            if (!req.body.type || !req.body.size || !req.body.name) {
                throw new HttpError(400, 'You should provide file name, size and type');
            }

            var path = req.params.realm;
            var key = path + '/' + crypto.randomBytes(16).toString('hex');
            var params = {
                Bucket: config.awsBucket,
                Key: key,
                Expires: 3600000,
                ContentType: req.body.type
            };
            var url = s3.getSignedUrl('putObject', params);

            var attempt = {
                key: key,
                filename: req.body.name,
                mimetype: req.body.type,
                size: req.body.size
            };

            yield thunkQuery(AttachmentAttempt.insert(attempt));

            return {
                url: url,
                key: key
            };

        }).then( function (data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    },

    delete: function(req, res, next){
        var thunkQuery = req.thunkQuery;
        co(function* (){
            // TODO check right

            if (!req.params.essenceId || !req.params.entityId || !req.params.id) {
                throw new HttpError(400, 'You should provide attachment id, essence Id and entity Id');
            }

            var link = yield thunkQuery(
                AttachmentLink
                .select()
                .where(
                    AttachmentLink.essenceId.equals(req.params.essenceId)
                    .and(AttachmentLink.entityId.equals(req.params.entityId))
                )
            );

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

            link[0].attachments.splice(attIndex,1); // remove attachment from links

            if (link[0].attachments.length) { // update attachments array
                yield thunkQuery(
                    AttachmentLink
                    .update(
                        { attachments: link[0].attachments }
                    ).where(
                        AttachmentLink.essenceId.equals(req.params.essenceId)
                        .and(AttachmentLink.entityId.equals(req.params.entityId))
                    )
                );
            } else { // attachments link empty, remove record
                yield thunkQuery(
                    AttachmentLink.delete().where(
                        AttachmentLink.essenceId.equals(req.params.essenceId)
                        .and(AttachmentLink.entityId.equals(req.params.entityId))
                    )
                );
            }

            // check for another records with this attachment id

            var records = yield thunkQuery(
                'SELECT * FROM "AttachmentLinks" WHERE "attachments" @> ARRAY[' + parseInt(req.params.id) + ']'
            );

            var data = {};

            if (!records.length) {
                var attachment = yield thunkQuery(Attachment.select().where(Attachment.id.equals(req.params.id)));

                if (attachment.length) {
                    yield thunkQuery(Attachment.delete().where(Attachment.id.equals(req.params.id)));

                    var params = {
                        Bucket: config.awsBucket,
                        Key: attachment[0].amazonKey
                    };

                    var awsResult = yield new Promise((resolve, reject) => {
                        s3.deleteObject(params, (err, data) => {
                            if (err) {
                                resolve({error: err}); // an error occurred
                            }
                            else {
                                resolve({error: null}); // successful response
                            }
                        });
                    });

                    if (awsResult.error) {
                        data.warning = 'Cannot delete file from remote server';
                    }
                }
            }

            return data;

        }).then(function(){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'attachments',
                entity: req.params.id,
                info: 'Delete attachment'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
    }

};
