var AWS = require('aws-sdk'),
  configAWS = require('lib/config/aws.json'),
  HttpError = require('app/error').HttpError,
  crypto = require('crypto'),
  fs = require('fs'),
  url = require('url'),
  thunkify = require('thunkify');



AWS.config.update({
  accessKeyId: configAWS.accessKeyId,
  secretAccessKey: configAWS.secretAccessKey
  //region: configAWS.region
});

var s3 = new AWS.S3({params: {Bucket: configAWS.Bucket}});

/*s3.uploadBase64Image = function (base64, pathFolder, cb) {
 var matches = base64.match(/^data:(.+\/(.+));base64,(.*)$/),
 mime_type = matches[1] || 'application/octet-stream',
 ext = matches[2] || 'jpg',
 data = matches[3],
 pathImage = pathFolder + '/' + randFileName() + '.' + ext,
 bufImage = new Buffer(data, 'base64'),
 prefix = configAWS.prefix;

 s3.putObject({
 Body: bufImage,
 Key: pathImage,
 ACL: "public-read",
 ContentType: mime_type
 }, function (err, data) {
 if (!err) {
 cb(null, prefix + pathImage);
 }
 else {
 cb(err)
 }
 });
 };*/


s3.uploadFile = function (image, pathFolder, cb) {
  if (image.size > parseInt(configAWS.maxFileSize)) {
    cb(400);
  }
  fs.readFile(image.path, function (err, data) {
    if (!err) {
      var curdate = new Date(),
         pathImage = pathFolder + curdate.getFullYear() + '-' + ('0' + (curdate.getMonth() + 1)).slice(-2) + '/' + randFileName() + '.' + image.extension;

      s3.putObject({
        Body: data,
        Key: pathImage,
        ACL: "public-read",
        ContentType: image.mimetype
      }, function (err, data) {
        if (!err) {
          return cb ? cb(null, configAWS.prefix + pathImage) : configAWS.prefix + pathImage;
        }
        else {
          return cb ? cb(err) : err;
        }
      });
    }
    else {
      return cb ? cb(err) : err;
    }
  });
};

s3.thunkUploadFile = thunkify(s3.uploadFile);

// upload file from form-data request to aws
s3.formdataImage = function (image, pathFolder, model, cb) {
  if (image.size > parseInt(configAWS.maxFileSize)) {
    cb(400);
  }
  fs.readFile(image.path, function (err, data) {
    if (!err) {

      var pathImage = pathFolder + '/' + randFileName() + '.' + image.extension;

      s3.putObject({
        Body: data,
        Key: pathImage,
        ACL: "public-read",
        ContentType: image.mimetype
      }, function (err, data) {
        if (!err) {
          cb(null, configAWS.prefix + pathImage, model);
        }
        else {
          cb(err)
        }
      });
    }
    else {
      cb(err);
    }
  });
};

//http://tripwecan.s3.amazonaws.com/AppImages/Transport/Bikes/1949bde762da8a4d_1413488705184.jpg
// delete file from aws by link
s3.deleteFile = function (file, cb) {
  if (!file) {
    cb(new HttpError(400, 'Bad image link'));
  }
  file = file.replace(configAWS.prefix,'');
  var params = {
    Bucket: configAWS.Bucket,
    Key: url.parse(file).pathname
  };
  s3.deleteObject(params, cb);
};

function randFileName() {
  return crypto.randomBytes(8).toString('hex') + '_' + Date.now();
}

module.exports = s3;