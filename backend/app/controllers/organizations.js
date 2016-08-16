var _ = require('underscore'),
    config = require('config'),
    common = require('app/services/common'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
    Language = require('app/models/languages'),
    Product = require('app/models/products'),
    crypto = require('crypto'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Query = require('app/util').Query,
    pgEscape = require('pg-escape'),
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    Emailer = require('lib/mailer'),
    thunkQuery = thunkify(query),
    mc = require('app/mc_helper'),
    notifications = require('app/controllers/notifications');

var debug = require('debug')('debug_organizations');
debug.log = console.log.bind(console);

module.exports = {

    selectOne: function (req, res, next) { //TODO superadmin request
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var data = yield thunkQuery(
                Organization.select().from(Organization).where(Organization.id.equals(req.params.id))
            );
            if (!data.length) {
                throw new HttpError(404, 'Not found');
            }
            return data;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    selectProducts: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.star()
                )
                .from(Product)
                .where(Product.organizationId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {

        co(function* () {
            var thunkQuery, data;
            if (req.user.roleID === 1 && req.params.realm === config.pgConnect.adminSchema) {
                data = [];
                for (var i in req.schemas) {
                    thunkQuery = thunkify(new Query(req.schemas[i]));
                    var org = yield thunkQuery(
                        Organization
                        .select(
                            Organization.star(),
                            '(SELECT ' +
                            '"Projects"."id" ' +
                            'FROM "Projects"' +
                            'WHERE ' +
                            '"Projects"."organizationId" = "Organizations"."id"' +
                            'LIMIT 1) as "projectId"'
                        )
                        .where(
                            Organization.realm.equals(req.schemas[i])
                        )
                    );
                    if (org.length) {
                        data.push(org[0]);
                    }
                }
                return data;

            } else {
                thunkQuery = thunkify(new Query(req.params.realm));

                data = yield thunkQuery(
                    Organization
                    .select(
                        Organization.star(),
                        '(SELECT ' +
                        '"Projects"."id" ' +
                        'FROM "Projects"' +
                        'WHERE ' +
                        '"Projects"."organizationId" = "Organizations"."id"' +
                        'LIMIT 1) as "projectId"'
                    )
                    .from(Organization),
                    _.omit(req.query, 'offset', 'limit', 'order')
                );
            }
            return data;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    editOne: function (req, res, next) {
        var clientThunkQuery = req.thunkQuery;

        if (req.params.realm === config.pgConnect.adminSchema) {
            throw new HttpError(400, 'Incorrect realm');
        }

        co(function* () {
            yield * checkOrgData(req);
            var updateObj = _.pick(req.body, Organization.editCols);
            if (Object.keys(updateObj).length) {
                yield clientThunkQuery(
                    Organization
                    .update(updateObj)
                    .where(Organization.id.equals(req.params.id))
                );
            }
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'organizations',
                entity: req.params.id,
                info: 'Update organization'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {

        if (req.user.roleID !== 1) {
            throw new HttpError(403, 'Only super admin can create organizations');
        }

        var adminThunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

        co(function* () {
            yield * checkOrgData(req);

            yield adminThunkQuery(pgEscape(
                'SELECT clone_schema(\'%s\',\'%s\', true)',
                config.pgConnect.sceletonSchema,
                req.body.realm
            ));

            var clientThunkQuery = thunkify(new Query(req.body.realm));

            if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                try { // reset schemas cache
                    var schemas = yield mc.delete(req.mcClient, 'schemas');
                } catch (e) {
                    debug(JSON.stringify(e));
                    throw new HttpError(500, e);
                }
            }

            req.thunkQuery = clientThunkQuery; // Do this because of bologger

            var org = yield clientThunkQuery(
                Organization
                .insert(
                    _.pick(req.body, Organization.table._initialConfig.columns)
                )
                .returning(Organization.id)
            );

            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'organizations',
                entity: org[0].id,
                info: 'Add organization'
            });

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
        var thunkQuery = req.thunkQuery;

        var csv = require('csv');
        var fs = require('fs');

        var upload = function* () {
            return yield new Promise(function (resolve, reject) {
                if (req.files.file) {
                    fs.readFile(req.files.file.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data.replace(new RegExp('[\'\"]', 'g'), '`'));
                    });
                } else {
                    reject(new HttpError(403, 'Please, pass csv file in files[\'file\']'));
                }
            });
        };

        var parser = function* (data) {
            return yield new Promise(function (resolve, reject) {
                csv.parse(data, {relax_column_count: true}, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file: ' + err.message));
                    }
                    resolve(data);
                });
            });
        };

        co(function* () {
            var org = yield thunkQuery(Organization.select().where(Organization.id.equals(req.params.id)));
            if (!org[0]) {
                throw new HttpError(403, 'Organization with id = ' + req.params.id + ' does not exist');
            }

            if (req.user.roleID !== 1 && req.user.organizationId !== parseInt(req.params.id)) {
                throw new HttpError(
                    403,
                    'You cannot add user to other organizations'
                );
            }

            var result = [];
            try {
                var doUpload = yield * upload();
                var parsed = yield * parser(doUpload);

                var prepareLevel = function (level) {
                    level = parseInt(level);
                    level = (isNaN(level) || level < 0 || level > 2) ? 0 : level;
                    return level;
                };
                var getStr = function (val) {
                    return (_.isString(val)) ? val.trim() : val;
                };
                var booleanValue = function (val) {
                    var result = false;
                    if (_.isString(val) && (val.trim().toUpperCase() === 'YES' || val.trim().toUpperCase() === 'TRUE')) {
                        result = true;
                    } else if (_.isBoolean(val)) {
                        result = val;
                    } else if (parseInt(val) === 1) {
                        result = true;
                    }
                    return result;
                };

                for (var i in parsed) {
                    if (parsed[i][0].substr(0, 2) !== '//') { // skip comment string
                        var pass = crypto.randomBytes(5).toString('hex');
                        var roleID = (req.user.roleID === 1 && parsed[i][3]) ? 2 : 3; // 2 - client, 3 - user
                        var notify = booleanValue(parsed[i][12]);

                        var existError = false;

                        var newUser = {
                            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                            parse_status: 'skipped',
                            email: getStr(parsed[i][0]),
                            firstName: getStr(parsed[i][1]),
                            lastName: getStr(parsed[i][2]),
                            roleID: roleID,
                            isActive: booleanValue(parsed[i][4]),
                            timezone: getStr(parsed[i][5]),
                            location: getStr(parsed[i][6]),
                            mobile: getStr(parsed[i][7]),
                            phone: getStr(parsed[i][8]),
                            address: getStr(parsed[i][9]),
                            lang: getStr(parsed[i][10]),
                            bio: getStr(parsed[i][11]),
                            notifyLevel: 2, // default = 2
                            organizationId: org[0].id
                        };

                        newUser.messages = [];
                        var valid = true;
                        if (!vl.isEmail(newUser.email)) {
                            newUser.messages.push('Email is not valid');
                        } else {
                            var isExist = yield thunkQuery(User.select().where(User.email.equals(newUser.email)));
                            if (isExist[0]) {
                                newUser.messages.push('Already exists');
                                valid = false;
                            } else {
                                // Validate and Set DEFAULT
                                // langId
                                var ret;
                                if (!newUser.lang) {
                                    // default EN
                                    ret = yield thunkQuery(Language.select().where(Language.code.equals('en')));
                                    if (ret[0]) {
                                        newUser.langId = ret[0].id;
                                        newUser.lang = 'en';
                                    } else {
                                        newUser.messages.push('Language `en` (default) does not exist in database');
                                        valid = false;
                                    }
                                } else {
                                    // check that specified Language is exist
                                    ret = yield thunkQuery(Language.select().where(Language.code.equals(newUser.lang)));
                                    if (ret[0]) {
                                        newUser.langId = ret[0].id;
                                    } else {
                                        newUser.messages.push('Language `' + newUser.lang + '` does not exist in database');
                                        valid = false;
                                    }
                                }
                                // choose invite template
                                var inviteTemplate = (newUser.isActive) ? 'orgInvite' : 'orgInvitePwd';
                                // If valid, then created
                                var created;
                                if (valid) {
                                    newUser.salt = crypto.randomBytes(16).toString('hex');
                                    newUser.password = User.hashPassword(newUser.salt, pass);
                                    newUser.activationToken = crypto.randomBytes(32).toString('hex');
                                    try {
                                        created = yield thunkQuery(User.insert(_.pick(newUser, User.whereCol)).returning(User.id));
                                    } catch (e) {
                                        newUser.messages.push(e);
                                        valid = false;
                                    }
                                }
                                if (valid && created[0]) {
                                    bologger.log({
                                        req: req,
                                        user: req.user,
                                        action: 'insert',
                                        object: 'users',
                                        entity: created[0].id,
                                        info: 'Add user (bulk import)'
                                    });
                                    newUser.id = created[0].id;
                                    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                                    newUser.parse_status = 'Ok';
                                    newUser.message = 'Added';
                                    var essenceId = yield * common.getEssenceId(req, 'Users');
                                    var note = yield * notifications.createNotification(req, {
                                            userFrom: req.user.realmUserId,
                                            userTo: newUser.id,
                                            body: 'Invite',
                                            essenceId: essenceId,
                                            entityId: newUser.id,
                                            notifyLevel: (notify ? 2 : 0),
                                            name: newUser.firstName,
                                            surname: newUser.lastName,
                                            company: org[0],
                                            inviter: req.user,
                                            token: newUser.activationToken,
                                            password: pass,
                                            subject: 'Indaba. Organization membership',
                                            config: config
                                        },
                                        inviteTemplate
                                    );
                                }
                            }
                        }

                        result.push(newUser);
                    }
                }
                return result;

            } catch (e) {
                throw e;
            }

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }
};

function* checkOrgData(req) {
    var cpg = config.pgConnect;

    var clientThunkQuery = thunkify(new Query(req.params.realm));
    var adminThunkQuery = thunkify(new Query(cpg.adminSchema));

    if (!req.params.id) { //create
        if (!req.body.name || !req.body.realm) {
            throw new HttpError(400, 'name and realm fields are required');
        }

        var schemas = yield adminThunkQuery(pgEscape( // better to select from db instead of memcache
            'SELECT pg_catalog.pg_namespace.nspname ' +
            'FROM pg_catalog.pg_namespace ' +
            'INNER JOIN pg_catalog.pg_user ' +
            'ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid) ' +
            'AND (pg_catalog.pg_user.usename = \'%s\')' +
            'WHERE pg_catalog.pg_namespace.nspname = \'%s\'',
            cpg.user,
            req.body.realm
        ));

        if (schemas.length) {
            throw new HttpError(400, 'Realm \'' + req.body.realm + '\' already exists');
        }
    } else {
        delete req.body.realm; // do not allow to edit realm in organization
    }

    if (req.body.adminUserId) {
        var existUser = yield clientThunkQuery(
            User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId))
        );
        if (!_.first(existUser)) {
            throw new HttpError(403, 'User with this id does not exist');
        }
    }

    // if (req.body.adminUserId) {
    //     var existUser = yield thunkQuery(
    //         User.select(User.star()).from(User).where(User.id.equals(req.body.adminUserId))
    //     );
    //     if (!_.first(existUser)) {
    //         throw new HttpError(403, 'User with this id does not exist');
    //     }
    // }
}
