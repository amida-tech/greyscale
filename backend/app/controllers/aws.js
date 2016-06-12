var _ = require('underscore'),
    HttpError = require('app/error').HttpError,
    AnswerAttachment = require('app/models/answer_attachments'),
    SurveyAnswer = require('app/models/survey_answers'),

    config = require('config'),
    crypto = require('crypto'),
    co = require('co'),
    AWS = require('aws-sdk');
AWS.config.update(config.aws);

var s3 = new AWS.S3();

module.exports = {
    getDownloadLink: function (req, res, next) {
        co(function* () {
            var key = req.body.key;
            var path = req.params.realm;
            var params = {
                Bucket: 'ntrlab-amida-indaba',
                Key: path + '/' + key
            };
            var url = s3.getSignedUrl('getObject', params);

            return {
                url: url
            };
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

};
