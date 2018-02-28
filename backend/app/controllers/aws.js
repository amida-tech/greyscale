var _ = require('underscore'),
    config = require('../../config'),
    crypto = require('crypto'),
    co = require('co'),
    aws = require('aws-sdk');

// Update the aws config with our access and secret key
aws.config.update(config.aws);

//Instantiate the S3 object
var s3 = new aws.S3();

/**
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image. Set the URL to expire after 60 seconds
 * @param req
 * @param res
 * @returns json
 */
module.exports.signS3 = function (req, res) {

    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
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
        const returnData = {
            signedRequest: data,
            url: 'https://'+ config.awsBucket + '.s3.amazonaws.com/'+fileName
        };

        res.write(JSON.stringify(returnData));
        res.end();
    });
};

//TODO: Delete or uncomment generator function depending on what frontend wants
// module.exports = {
//     signS3: function (req, res, next) {
//         co(function* () {
//             const fileName = req.query['file-name'];
//             const fileType = req.query['file-type'];
//             const s3Params = {
//                 Bucket: config.awsBucket,
//                 Key: fileName,
//                 Expires: 60,
//                 ContentType: fileType,
//                 ACL: 'public-read'
//             };
//             const signedRequest = s3.getSignedUrl('putObject', s3Params);
//
//             return signedRequest;
//
//         }).then(function (data) {
//             res.json(data);
//         }, function (err) {
//             next(err);
//         });
//     }
// };

module.exports.getDownloadLink = function (req, res, fileName) {

    const params = {
        Bucket: config.awsBucket,
        Key: fileName
    };

    const url = s3.getSignedUrl('getObject', params);

    return url;
};
