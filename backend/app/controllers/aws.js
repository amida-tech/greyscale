var _ = require('underscore'),
    HttpError = require('app/error').HttpError,
    AnswerAttachment = require('app/models/answer_attachments'),
    SurveyAnswer = require('app/models/survey_answers'),
    AttachmentAttempt = require('app/models/attachment_attempts'),
    config = require('config'),
    crypto = require('crypto'),
    co = require('co'),
    AWS = require('aws-sdk');
    AWS.config.update(config.aws);

    var s3 = new AWS.S3();

module.exports = {
    getDownloadLink: function (req, res, next) {
        co( function* () {
            var key = req.body.key;
            var path = req.params.realm;
            var params = { Bucket: 'ntrlab-amida-indaba', Key: path + '/' + key };
            var url = s3.getSignedUrl('getObject', params);

            return {
                url: url
            };
        }).then( function (data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    },

    uploadSuccess: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co( function* () {
            if (!req.body.key || !req.body.essenceId || !req.body.entityId) {
                throw new HttpError(400, 'You should provide key, essenceId and entityId');
            }

            var essence = yield thunkQuery(Essence.select().where(Essence.id.equals(req.body.essenceId)));

            if(!essence.length){
                throw new HttpError(400, 'Essence with id = ' + req.body.essenceId + 'does not exist');
            }

            try {
                var model = require('app/models/' + essence[0].fileName);
            } catch (err) {
                throw new HttpError(400, 'Cannot load essence model file');
            }

            var entity = yield thunkQuery(model.select().where(model.id.equals(req.body.entityId)));

            if (!entity.length) {
                throw new HttpError(400, essence[0].name + ' with id = ' + req.body.entityId + ' does not exist');
            }

            //var answer = yield thunkQuery(SurveyAnswer.select().where(SurveyAnswer.id.equals(req.body.answerId)));
            //if (!answer.length) {
            //    throw new HttpError(400, 'Answer with id = ' + req.body.answerId + ' does not exist');
            //}

            var attempt = yield thunkQuery(AttachmentAttempt.select().where(AttachmentAttempt.key.equals(req.body.key)));
            if (!attempt.length) {
                throw new HttpError(400, 'Key is not valid');
            }

            var attachment = {
                // Id: req.body.answerId,
                filename: attempt[0].filename,
                size: attempt[0].size,
                mimetype: attempt[0].mimetype,
                owner: req.user.realmUserId,
                amazonKey: req.body.key
            };

            var id = yield thunkQuery(Attachment.insert(attachment).returning(Attachment.id));

            // insert record to links ???

            yield thunkQuery(AttachmentAttempt.delete().where(AttachmentAttempt.key.equals(req.body.key)));

            return id[0];

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
            var params = { // TODO add params like mimetype, etc.
                Bucket: 'ntrlab-amida-indaba',
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
    }
};