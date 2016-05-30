var _ = require('underscore'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    AWS = require('aws-sdk');


    var awsConf = {
        accessKeyId: 'AKIAIWUKVZJ6NTM4GD5Q',
        secretAccessKey: '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',
        region: 'us-west-1',
        bucket: 'ntrlab-amida-indaba'
    };

    AWS.config.update(awsConf);

    var s3 = new AWS.S3();

module.exports = {
    getDownloadLink: function (req, res, next) {
        co( function* () {

        }).then( function (data) {

        }, function(err) {
            next(err);
        });
    },

    getUploadLink: function (req, res, next) {
        co( function* () {

            var params = {Bucket: awsConf.bucket, Key: 'semyon/db.jpeg'};
            var url = s3.getSignedUrl('getObject', params);
            return {
                url: url
            };
            //return yield new Promise(
            //    (resolve, reject) => {
            //        s3.listBuckets(function(err, data) {
            //            if (err) {
            //                reject(err);
            //            } else {
            //                resolve(data);
            //            }
            //        });
            //    }
            //);

        }).then( function (data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    }
};