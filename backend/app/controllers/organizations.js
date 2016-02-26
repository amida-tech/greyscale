var _ = require('underscore'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
    Project = require('app/models/projects'),
    crypto = require('crypto'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    Emailer = require('lib/mailer'),
    thunkQuery = thunkify(query);

module.exports = {

    selectOne: function (req, res, next) {
        var q = Organization.select().from(Organization).where(Organization.id.equals(req.params.id));
        query(q, {'realm': req.param('realm')}, function (err, data) {
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
        	req.query.realm = req.param('realm');
            return yield thunkQuery(
                Organization.select().from(Organization), _.omit(req.query, 'offset', 'limit', 'order')
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    editOne: function (req, res, next) {
        co(function* () {
            yield *checkOrgData(req);
            var updateObj = _.pick(req.body, Organization.editCols);
            if(Object.keys(updateObj).length){
                yield thunkQuery(
                    Organization
                    .update(updateObj)
                    .where(Organization.id.equals(req.params.id))
                );
            }
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield *checkOrgData(req);
            var org = yield thunkQuery(
                Organization
                .insert(
                    _.pick(req.body, Organization.table._initialConfig.columns)
                )
                .returning(Organization.id),  {'realm': req.param('realm')}
            );
            // TODO creates project in background, may be need to disable in future
            yield thunkQuery(
                Project.insert(
                    {
                        organizationId: org[0].id,
                        codeName: 'Org_' + org[0].id + '_project'
                    }
                ),  {'realm': req.param('realm')}
            );
            return org;
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

        var upload = function*(){
            return yield new Promise(function(resolve, reject) {
                if(req.files.file) {
                    fs.readFile(req.files.file.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data);
                    });
                }else{
                    reject( new HttpError(403,'Please, pass csv file in files[\'file\']'));
                }
            });
        };

        var parser = function* (data) {
            return yield new Promise(function(resolve, reject){
                csv.parse(data, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file'));
                    }
                    resolve(data);
                });
            });
        };

        co(function* () {
            var org = yield thunkQuery(Organization.select().where(Organization.id.equals(req.params.id)));
            if(!org[0]){
                throw new HttpError(403, 'Organization with id = '+req.params.id+' does not exist');
            }

            if (req.user.roleID !== 1 && req.user.organizationId !== req.params.id) {
                throw new HttpError(403, 'You cannot add user to other organizations');
            }

            var result = [];
            try {
                var doUpload = yield* upload();
                var parsed = yield* parser(doUpload);

                var prepareLevel = function (level){
                    level = parseInt(level);
                    level = (isNaN(level) || level < 0 || level >  2) ? 0 : level;
                    return level;
                };

                for (var i in parsed) {
                    if (i !== 0) { // skip first string
                        var pass = crypto.randomBytes(5).toString('hex');
                        var roleID = (req.user.roleID === 1 && parsed[i][3]) ? 2 : 3; // 2 - client, 3 - user

                        var existError = false;

                        if (roleID === 2 && org[0].adminUserId) { // admin already exists
                            existError = true;
                            roleID = 3;
                        }

                        var newUser = {
                            parse_status   : 'skipped',
                            email          : parsed[i][0],
                            firstName      : parsed[i][1],
                            lastName       : parsed[i][2],
                            roleID         : roleID,
                            isActive       : false, //(parsed[i][4]) cannot activate until email confirmation
                            timezone       : parsed[i][5],
                            location       : parsed[i][6],
                            mobile         : parsed[i][7],
                            phone          : parsed[i][8],
                            address        : parsed[i][9],
                            lang           : parsed[i][10],
                            bio            : parsed[i][11],
                            notifyLevel    : prepareLevel(parsed[i][12]),
                            organizationId : org[0].id
                        };

                        if (!vl.isEmail(newUser.email)) {
                            newUser.message = 'Email is not valid';
                        }else{
                            var isExist = yield thunkQuery(User.select().where(User.email.equals(newUser.email)),{'realm': req.param('realm')});
                            if (isExist[0]) {
                                newUser.message = 'Already exists';
                            }else{

                                newUser.password = User.hashPassword(pass);
                                newUser.activationToken = crypto.randomBytes(32).toString('hex');
                                var created = yield thunkQuery(
                                    User.insert(_.pick(newUser, User.whereCol)).returning(User.id),
                                    {'realm': req.param('realm')}
                                );

                                if (roleID == 2) {
                                    yield thunkQuery(
                                        Organization
                                        .update({adminUserId: created[0].id})
                                        .where(Organization.id.equals(org[0].id)),
                                        {'realm': req.param('realm')}
                                    );
                                    org[0].adminUserId = created[0].id;
                                }
                                if (created[0]) {
                                    newUser.id = created[0].id;
                                    newUser.parse_status = 'Ok';
                                    if (existError) {
                                        newUser.message = 'Admin for this company already exists, added as user';
                                    }else{
                                        newUser.message = 'Added';
                                    }
                                }

                                var options = {
                                    to: {
                                        name: newUser.firstName,
                                        surname: newUser.lastName,
                                        email: newUser.email,
                                        subject: 'Indaba. Organization membership'
                                    },
                                    template: 'org_invite'
                                };
                                var data = {
                                    name: newUser.firstName,
                                    surname: newUser.lastName,
                                    company: org[0],
                                    inviter: req.user,
                                    token: newUser.activationToken
                                };
                                var mailer = new Emailer(options, data);
                                mailer.send(function (data) {
                                    console.log('EMAIL RESULT --->>>');
                                    console.log(data);

                                });
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

function* checkOrgData(req){
    if (!req.params.id){ //create
        if (!req.body.name) {
            throw new HttpError(400, 'name field is required');
        }
    }
    if (req.body.adminUserId) {
        var existUser = yield thunkQuery(
            User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId))
        );
        if (!_.first(existUser)) {
            throw new HttpError(403, 'User with this id does not exist');
        }
    }
}
