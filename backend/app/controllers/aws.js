var _ = require('underscore'),
    config = require('../../config'),
    crypto = require('crypto'),
    co = require('co'),
    aws = require('aws-sdk'),
    HttpError = require('../error').HttpError;

// Update the aws config with our access and secret key
aws.config.update(config.aws);

//Instantiate the S3 object
var s3 = new aws.S3();

module.exports = {
    getDownloadLink: function (req, res, next) {
        co(function* () {
            var key = req.body.key;
            var path = req.params.realm;
            var params = {
                Bucket: config.awsBucket,
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

/**
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 * @param req
 * @param res
 * @returns json
 */
module.exports.signS3 = function (req, res) {

    var fileName = req.query['file-name'];
    var fileType = req.query['file-type'];
    var s3Params = {
        Bucket: config.awsBucket,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3Params, function (err, data) {
        if (err) {
            return res.end();
        }
        var returnData = {
            signedRequest: data,
            url: 'https://'+ config.awsBucket + '.s3.amazonaws.com/'+fileName
        };

        res.write(JSON.stringify(returnData));
        res.end();
    })
};

module.exports.getDownloadLink = function (req, res, fileName) {
    var params = {
        Bucket: config.awsBucket,
        Key: fileName
    };

    s3.getSignedUrl('getObject', params, function (err, url) {
        if (err) {
            throw new HttpError(403, err);
        }
        return url;
    })
};
