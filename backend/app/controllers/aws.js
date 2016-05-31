var _ = require('underscore'),
    HttpError = require('app/error').HttpError,
    config = require('config'),
    crypto = require('crypto'),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    AWS = require('aws-sdk');
    AWS.config.update(config.aws);

    var s3 = new AWS.S3();

module.exports = {
    getDownloadLink: function (req, res, next) {
        co( function* () {
            var path = req.params.realm;
            var params = {Bucket: 'ntrlab-amida-indaba', Key: path + '/' + key};
            var url = s3.getSignedUrl('putObject', params);

            return {
                url: url
            };
        }).then( function (data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    },

    getUploadLink: function (req, res, next) {
        co( function* () {
            var key = crypto.randomBytes(16).toString('hex');
            var path = req.params.realm;
            var params = {Bucket: 'ntrlab-amida-indaba', Key: path + '/' + key};
            var url = s3.getSignedUrl('putObject', params);

            return {
                url: url
            };

        }).then( function (data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    }
};