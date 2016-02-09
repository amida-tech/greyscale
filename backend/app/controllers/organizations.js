var _ = require('underscore'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
    crypto = require('crypto'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    selectOne: function (req, res, next) {
        var q = Organization.select().from(Organization).where(Organization.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                next(new HttpError(404, 'Not found'));
            }
        });
    },

    select: function (req, res, next) {

        co(function* () {
            return yield thunkQuery(Organization.select().from(Organization), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        co(function* () {
            if (!req.body.adminUserId) {
                throw new HttpError(400, 'Admin user id field is required');
            }
            var existUser = yield thunkQuery(User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId)));
            if (!_.first(existUser)) {
                throw new HttpError(403, 'User with this id does not exist');
            }
            return yield thunkQuery(Organization.insert(req.body).returning(Organization.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    csvUsers: function (req, res, next) {
        // fields order
        // EMAIL,FIRST-NAME,LAST-NAME,COMPANY-ADMIN,STATUS,TIMEZONE,
        // LOCATION,CELL,PHONE,ADDRESS,LANG (E.G. EN),BIO,LEVEL-NOTIFY

        var csv = require('csv');
        var fs = require('fs');

        //req.user = {
        //    id: 76,
        //    firstName: 'Semyon',
        //    lastName: 'Babushkin',
        //    role: 'admin',
        //    email: 'next15@mail.ru',
        //    roleID: 2,
        //    rights:[
        //        'rights_view_one',
        //        'rights_add_one',
        //        'rights_delete_one',
        //        'rights_view_all',
        //        'product_delete',
        //        'users_token',
        //        'product_uoa'
        //    ],
        //    organizationId: 10
        //};

        var upload = function*(){
            return yield new Promise(function(resolve, reject) {
                if(req.files.image) {
                    fs.readFile(req.files.image.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data);
                    });
                }else{
                    reject( new HttpError(403,'File has not uploaded'));
                }
            });
        }

        var parser = function* (data) {
            return yield new Promise(function(resolve, reject){
                csv.parse(data, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file'));
                    }
                    resolve(data);

                });
            });
        }


        co(function* () {
            var org = yield thunkQuery(Organization.select().where(Organization.id.equals(req.params.id)));
            if(!org[0]){
                throw new HttpError(403, 'Organization with id = '+req.params.id+' does not exist');
            }

            if (req.user.roleID != 1 && req.user.organizationId != req.params.id) {
                throw new HttpError(403, 'You cannot add user to other organizations');
            }

            var result = [];
            try {
                var doUpload = yield* upload();
                var parsed = yield* parser(doUpload);
                for (var i in parsed) {
                    if (i != 0) { // skip first string
                        var pass = crypto.randomBytes(5).toString('hex');
                        var newUser = {
                            status : 'skipped',
                            email : parsed[i][0],
                            firstName : parsed[i][1],
                            lastName : parsed[i][2],
                            phone : parsed[i][8],
                            roleID : parsed[i][3] ? 2 : 3, // 2 - client, 3 - user
                            organizationId : org[0].id
                        }

                        if (!vl.isEmail(newUser.email)) {
                            newUser.message = 'Email is not valid';
                        }else{
                            var isExist = yield thunkQuery(User.select().where(User.email.equals(newUser.email)));
                            if (isExist[0]) {
                                newUser.message = 'Already exists';
                            }else{
                                newUser.password = User.hashPassword(pass);
                                var created = yield thunkQuery(User.insert(_.pick(newUser, User.whereCol)).returning(User.id));
                                if (created[0]) {
                                    newUser.id = created[0].id;
                                    newUser.status = 'Ok';
                                    newUser.message = 'Added';
                                }
                            }
                        }

                        result.push(newUser);
                    }
                }
                return result;

            } catch(e) {
                throw e;
            }

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        })
    }

};
