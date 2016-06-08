var config = require('./config');
var app = require('express')();
var co = require('co');
var Client = require('pg').Client;
var AWS = require('aws-sdk');
var crypto = require('crypto');
AWS.config.update(config.aws);
var s3 = new AWS.S3();

app.on('start', function () {
    console.log('START..');


    var ClientPg = function() {
        var client = new Client(config.pgConnect);

        client.on('error', function (err) {
            console.log('ERROR: cannot connect to DB: ' + JSON.stringify(err));
        });

        client.on('drain', client.end.bind(client));

        client.on('end', function(){
            console.log("Client was disconnected.");
        });

        return client;
    }



    var doQuery = function (sql) {
        return new Promise((resolve, reject) => {
            var client = new ClientPg();
            client.connect(function (err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(sql);
                    client.query(sql, function (err, results) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results.rows);
                        }
                    });
                }
            });
        });
    };

    var putToS3 = function (item, key) {
        return new Promise((resolve, reject) => {
            var params = {
                Bucket: config.aws.bucket,
                Key: key,
                Body: new Buffer(item.body),
                ContentType: item.mimetype,
                ContentDisposition: 'attachment; filename="' + item.filename + '"',
            };

            console.log(params);

            s3.putObject(params, function(err, data) {
                if (err) resolve({error: err}); // an error occurred
                else     resolve({data: data, error: null});// successful response
            });
        });
    }

    co(function* (){

        var sql =
            'SELECT pg_catalog.pg_namespace.nspname ' +
            'FROM pg_catalog.pg_namespace ' +
            'INNER JOIN pg_catalog.pg_user ' +
            'ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid) ' +
            'AND (pg_catalog.pg_user.usename = \''+ config.pgConnect.user +'\') ';

        var schemas = yield doQuery(sql);

        for (var index in schemas) {
            var namespace = schemas[index].nspname;

            var preSQL = 'SET search_path TO ' + namespace + ';';

            var sql = preSQL + 'SELECT * FROM "Attachments" WHERE "amazonKey" IS NULL LIMIT 1';

            var attachments =  yield doQuery(sql);

            while (attachments.length) {
                var path = namespace; //req.params.realm;
                var key = path + '/' + crypto.randomBytes(16).toString('hex');

                var upload = yield putToS3(attachments[0], key);

                if (upload.error) {
                    console.log('FILE UPLOAD ERROR: ' + JSON.stringify(upload.error));
                } else {
                    var updateSql = preSQL + 'UPDATE "Attachments" SET "amazonKey" = \'' + key + '\' WHERE id = ' + attachments[0].id;
                    yield doQuery(updateSql);

                    var params = { Bucket: config.aws.bucket, Key: key, Expires: 3600000};
                    var url = s3.getSignedUrl('getObject', params);

                    console.log('FILE UPLOADED TO S3, url for test = ' + url);
                }

                sql = preSQL + 'SELECT * FROM "Attachments" WHERE "amazonKey" IS NULL LIMIT 1';
                attachments =  yield doQuery(sql);
            }
        }

    }).then(function (res) {
        console.log('DONE');
    }, function (err) {
        console.log('ERROR: ' + JSON.stringify(err));
        console.log(err);
    });

});

app.emit('start');

module.exports = app;