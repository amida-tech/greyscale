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
    crypto = require('crypto'),
    mc = require('app/mc_helper'),
    thunkQuery = thunkify(query);

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

    add: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* (){
            if (!req.body.essenceId) {
                throw new HttpError(400, 'essenceId field is required');
            }

            try{
                var essence = yield common.getEssence(req, req.body.essenceId);
            }catch(err){
                throw err;
            }

            try{
                var model = require('app/models/' + essence.fileName);
            }catch(err){
                throw new HttpError(404, 'Cannot find essence model file (' + essence.fileName + ')');
            }

            if (req.body.entityId) {
                var entity = yield thunkQuery(model.select().where(model.id.equals(req.body.entityId)));
                if (!entity.length) {
                    throw new HttpError(404, essence.name + ' with id = ' + req.body.entityId + ' does not exist');
                }
            }

            if (req.files.file) {
                var file = req.files.file;

                if (file.size > config.max_upload_filesize) {
                    throw new HttpError(400, 'File must be less then 10 MB');
                }

                var load = new Promise(function (resolve, reject) {

                    fs.readFile(file.path, 'hex', function(err, fileData) {
                        fileData = '\\x' + fileData;
                        if (err) {
                            reject(err);
                        }
                        resolve(fileData);
                    });

                });

                try{
                    var filecontent = yield load;
                } catch(e) {
                    debug(e);
                    throw new HttpError(500, 'File upload error');
                }

                var record = {
                    filename: file.originalname,
                    essenceId: req.body.essenceId,
                    size: file.size,
                    mimetype: file.mimetype,
                    body: filecontent,
                    owner: req.user.realmUserId
                };

                if (req.body.entityId) {
                    record.entityId = req.body.entityId;
                }

                var inserted = yield thunkQuery(
                    Attachment.insert(record).returning(Attachment.id)
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'attachments',
                    entity: inserted[0].id,
                    info: 'Insert attachment'
                });

                return inserted[0];

            } else {
                throw HttpError(400, 'File was not sent');
            }

        }).then(function(data) {
            res.status(201).json(data);

        }, function(err) {
            next(err);
        });
    },

    link: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var attach = yield thunkQuery(
                Attachment.select().where(Attachment.id.equals(req.params.id))
            );

            if (!attach[0]) {
                throw new HttpError(400, 'Attachment with id = ' + req.params.id + ' does not exist');
            }

            if (attach[0].entityId) {
                throw new HttpError(400, 'Attachment has already linked with some entity');
            }

            try{
                var essence = yield common.getEssence(req, attach[0].essenceId);
            }catch(err){
                throw err;
            }

            try{
                var model = require('app/models/' + essence.fileName);
            }catch(err){
                throw new HttpError(404, 'Cannot find essence model file (' + essence.fileName + ')');
            }

            var entity = yield thunkQuery(
                model.select().where(model.id.equals(req.params.entityId))
            );

            if (!entity.length) {
                throw new HttpError(404, essence.name + ' with id = ' + req.params.entityId + ' does not exist');
            }

            return yield thunkQuery(
                Attachment
                    .update({entityId: req.params.entityId})
                    .where(Attachment.id.equals(req.params.id))
                    .returning(Attachment.id)
            );

        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'attachments',
                entity: data[0].id,
                info: 'Update (link) attachment'
            });
            res.status(202).json(data);
        }, function(err){
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

            var ticket = crypto.randomBytes(10).toString('hex');

            try{
                var r = yield mc.set(req.mcClient, ticket, attachment[0].id);
                return ticket;
            }catch(e){
                throw new HttpError(500, e);
            }

        }).then(function(data){
            res.status(201).json({tiсket:data});
        }, function(err){
            next(err);
        });
    },

    getAttachment: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            try{
                var id = yield mc.get(req.mcClient, req.params.ticket);
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
    },

    delete: function(req, res, next){
        var thunkQuery = req.thunkQuery;
        co(function* (){
            var attach = yield thunkQuery(
                Attachment.select().where(Attachment.id.equals(req.params.id))
            );
            if (!attach[0]) {
                throw new HttpError(404, 'Attachment not found');
            }
            if(attach[0].owner != req.user.id){
                throw new HttpError(404, 'Only owner can delete attachment');
            }
            yield thunkQuery(Attachment.delete().where(Attachment.id.equals(req.params.id)));
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
