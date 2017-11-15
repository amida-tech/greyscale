var client = require('../db_bootstrap'),
    _ = require('underscore'),
    crypto = require('crypto'),
    config = require('../../config'),
    common = require('../services/common'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    User = require('../models/users'),
    Organization = require('../models/organizations'),
    Rights = require('../models/rights'),
    Token = require('../models/token'),
    vl = require('validator'),
    HttpError = require('../error').HttpError,
    util = require('util'),
    async = require('async'),
    UserUOA = require('../models/user_uoa'),
    UserGroup = require('../models/user_groups'),
    UOA = require('../models/uoas'),
    sql = require('sql'),
    notifications = require('../controllers/notifications'),
    request = require('request')
    config = require('../../config');

var Role = require('../models/roles');
var Query = require('../util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    thunkrandomBytes = thunkify(crypto.randomBytes);

module.exports = {
    checkToken: function (req, res, next) {
        var thunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

        co(function* () {

            var existToken = yield thunkQuery(
                Token
                .select()
                .where(
                    Token.body.equals(req.params.token)
                    .and(Token.realm.equals(req.params.realm))
                )
            );

            if (!_.first(existToken)) {
                throw new HttpError(400, 'Token invalid');
            }

            return existToken;

        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    logout: function (req, res, next) {
        co(function* () {
            var id = req.params.id || req.user.id;

            if (!id) {
                throw new HttpError(404);
            }

            yield thunkQuery(
                Token
                .delete()
                .where(
                    Token.userID.equals(id)
                    .and(Token.realm.equals(req.params.realm))
                )
            );

        }).then(function () {
            bologger.log({
                //req: req, Does not use req if you want to use public namespace TODO realm?
                user: req.user,
                action: 'delete',
                object: 'token',
                entities: {
                    userID: req.params.id || req.user.id,
                    realm: req.params.realm
                },
                quantity: 1,
                info: 'Delete token'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });

    },

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(User.select(User.count('counter')), req.query);

            var groupQuery = 'array(' +
                'SELECT "UserGroups"."groupId" FROM "UserGroups" WHERE "UserGroups"."userId" = "Users"."id"' +
                ') as "usergroupId"';

            var user = thunkQuery(
                User.select(
                    User.star(),
                    req.params.realm === config.pgConnect.adminSchema ? 'null' : groupQuery
                ),
                _.omit(req.query, 'offset', 'limit', 'order')
            );
            return yield [_counter, user];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.map(_.last(data), User.view));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var user = yield * insertOne(req, res, next);

            if (process.env.NODE_ENV !== 'test') { // Do this on production or staging
                if (user) {
                    // Create user on Auth service
                    _createUserOnAuthService(req.body.email, req.body.password, user.roleID, function (err, response, body) {
                        if (response.statusCode !== 200) {
                            throw new HttpError(response.statusCode, 'User Could not be created on the auth service');
                        }
                    });
                }
            }

            if (req.body.projectId) {
                yield * common.insertProjectUser(req, user.id, req.body.projectId);
            }
            return user;
        }).then(function (data) {
            res.status(201).json({
                id: data.id,
                firstName: data.firstName,
                email: data.email,
                lastName: data.lastName,
                roleID: data.roleID,
                organizationId: data.organizationId,
                isActive: data.isActive,
                registered: data.registered,
            });
        }, function (err) {
            next(err);
        });

    },

    invite: function (req, res, next) {
        var thunkQuery = thunkify(new Query(config.pgConnect.adminSchema));
        co(function* () {

            if (req.params.realm !== config.pgConnect.adminSchema) {
                throw new HttpError(400, 'Incorrect realm');
            }

            if (req.user.roleID !== 1) {
                throw new HttpError(403, 'You cannot invite super admins');
            }

            if (!req.body.email || !req.body.firstName) {
                throw new HttpError(400, 'Email and First name fields are required');
            }

            if (!vl.isEmail(req.body.email)) {
                throw new HttpError(400, 101);
            }
            var isExistUser = yield thunkQuery(User.select(User.star()).where(User.email.equals(req.body.email)));
            isExistUser = _.first(isExistUser);

            if (isExistUser) {
                throw new HttpError(400, 'User with this email has already registered');
            }

            var activationToken = crypto.randomBytes(32).toString('hex');
            var salt = crypto.randomBytes(16).toString('hex');
            var pass = crypto.randomBytes(5).toString('hex');

            var newClient = {
                'firstName': req.body.firstName,
                'lastName': req.body.lastName,
                'email': req.body.email,
                'roleID': 1, // super admin
                'salt': salt,
                'password': User.hashPassword(salt, pass),
                'isActive': false,
                'activationToken': activationToken,
                'isAnonymous': false,
                'notifyLevel': req.body.notifyLevel
            };

            var user = yield thunkQuery(User.insert(newClient).returning(User.id));

            if (process.env.NODE_ENV !== 'test') { // Do this only on production or staging
                // Create user on the auth service
                if (user) {
                    _createUserOnAuthService(req.body.email, req.body.password, user.roleID, function (err, response, body) {
                        if (response.statusCode !== 200) {
                            throw new HttpError(response.statusCode, 'User Could not be created on the auth service');
                        }
                    });
                }
            }

            bologger.log({
                //req: req, Does not use req if you want to use public namespace TODO realm?
                user: req.user,
                action: 'insert',
                object: 'users',
                entity: _.first(user).id,
                info: 'Add new superuser (invite)'
            });

            var essenceId = yield * common.getEssenceId(req, 'Users');
            var note = yield * notifications.createNotification(req, {
                userFrom: req.user.realmUserId ? req.user.realmUserId : req.user.id,
                userTo: _.first(user).id,
                body: 'Superadmin Invite',
                essenceId: essenceId,
                entityId: _.first(user).id,
                notifyLevel: req.body.notifyLevel,
                name: req.body.firstName,
                surname: req.body.lastName,
                login: req.body.email,
                password: pass,
                token: activationToken,
                subject: 'Indaba. Superadmin invite',
                config: config
            },
                'invite'
            );

            return user;

        }).then(function (data) {
            res.json(data[0]);
        }, function (err) {
            next(err);
        });
    },

    checkActivationToken: function (req, res, next) {
        var thunkQuery = thunkify(new Query(req.params.realm));
        co(function* () {
            var isExist = yield thunkQuery(User.select(User.star()).from(User).where(User.activationToken.equals(req.params.token)));
            if (!_.first(isExist)) {
                throw new HttpError(400, 'Token is not valid');
            }
            return isExist;
        }).then(function (data) {
            res.json(User.view(_.first(data)));
        }, function (err) {
            next(err);
        });
    },

    activate: function (req, res, next) {
        var thunkQuery = thunkify(new Query(req.params.realm));
        co(function* () {
            var isExist = yield thunkQuery(User.select(User.star()).from(User).where(User.activationToken.equals(req.params.token)));
            if (!_.first(isExist)) {
                throw new HttpError(400, 'Token is not valid');
            }
            if (!req.body.password) {
                throw new HttpError(400, 'Password field is required!');
            }
            var data = {
                activationToken: null,
                isActive: true,
                password: User.hashPassword(_.first(isExist).salt, req.body.password),
                firstName: req.body.firstName,
                lastName: req.body.lastName
            };
            var updated = yield thunkQuery(User.update(data).where(User.activationToken.equals(req.params.token)).returning(User.id));
            bologger.log({
                req: req,
                user: _.first(updated),
                action: 'update',
                object: 'users',
                entity: _.first(updated).id,
                info: 'Activate user'
            });
            return updated;
        }).then(function (data) {
            res.json(User.view(_.first(data)));
        }, function (err) {
            next(err);
        });
    },

    selfOrganization: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var org = yield thunkQuery(
                Organization
                .select(Organization.star())
                .from(Organization)
                .where(Organization.id.equals(req.user.organizationId))
            );
            org = _.first(org);

            if (!org) {
                throw new HttpError(404, 'Not found');
            }
            return org;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selfOrganizationUpdate: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!req.body.name || !req.body.address || !req.body.url) {
                throw new HttpError(400, 'Name, address and url fields are required');
            }
            var data = {
                name: req.body.name,
                address: req.body.address,
                url: req.body.url,
                isActive: true
            };
            var updated = yield thunkQuery(
                Organization
                .update(data)
                .where(Organization.adminUserId.equals(req.user.id))
                .returning(Organization.id)
            );
            if (!_.first(updated)) {
                throw new HttpError(404, 'Not found');
            }
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'organizations',
                entity: _.first(updated).id,
                info: 'Update organization (self)'
            });
            return updated;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    selfOrganizationInvite: function (req, res, next) {

        if (req.params.realm === config.pgConnect.adminSchema) {
            throw new HttpError(400, 'Incorrect realm');
        }

        co(function* () {

            if (req.body.roleID === 1) {
                throw new HttpError(400, 'You cannot invite super admins');
            }

            if (!req.body.email || !req.body.firstName || !req.body.roleID) {
                throw new HttpError(400, 'Role id, Email and First name fields are required');
            }

            if (!vl.isEmail(req.body.email)) {
                throw new HttpError(400, 101);
            }

            var isExistsAdmin = yield * common.isExistsUserInRealm(req, config.pgConnect.adminSchema, req.body.email);
            var isExistUser = yield * common.isExistsUserInRealm(req, req.params.realm, req.body.email);

            if ((isExistUser && isExistUser.isActive) || isExistsAdmin) {
                throw new HttpError(400, 'User with this email has already registered');
            }

            var thunkQuery = thunkify(new Query(req.params.realm));

            var org = yield thunkQuery(
                Organization.select().where(Organization.realm.equals(req.params.realm))
            );

            if (!org[0]) {
                throw new HttpError(404, 'Organization not found');
            }

            org = org[0];

            var firstName = isExistUser ? isExistUser.firstName : req.body.firstName;
            var lastName = isExistUser ? isExistUser.lastName : req.body.lastName;
            var activationToken = isExistUser ? isExistUser.activationToken : crypto.randomBytes(32).toString('hex');
            var salt = crypto.randomBytes(16).toString('hex');
            var pass = crypto.randomBytes(5).toString('hex');

            var newClient;
            var newUserId = isExistUser ? isExistUser.id : 0;
            if (!isExistUser) {
                newClient = {
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'roleID': req.body.roleID, //user
                    'salt': salt,
                    'password': User.hashPassword(salt, pass),
                    'isActive': false,
                    'activationToken': activationToken,
                    'organizationId': org.id,
                    'isAnonymous': req.body.isAnonymous ? true : false,
                    'notifyLevel': req.body.notifyLevel
                };

                var userId = yield thunkQuery(User.insert(newClient).returning(User.id));

                // if (process.env.NODE_ENV !== 'test') { // Do this on production or staging only
                    // Create user on the auth service
                if (userId) {
                    _createUserOnAuthService(req.body.email, req.body.password, req.body.roleID, function (err, response, body) {
                        console.log(`BODY IS: ${body.message}`)
                        console.log(`STATUS CODE IS: ${response.statusCode}`)
                        if (response.statusCode !== 200) {
                            throw new HttpError(response.statusCode, 'User Could not be created on the auth service');
                        }
                    });
                }
                // }

                newUserId = userId[0].id;
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'users',
                    entity: newUserId,
                    info: 'Add new user (org invite)'
                });

                if (req.body.roleID === 2) { // invite admin
                    if (!org.adminUserId) {
                        yield thunkQuery(
                            Organization.update({
                                adminUserId: newUserId
                            }).where(Organization.id.equals(org.id))
                        );
                    }
                }

                var essenceId = yield * common.getEssenceId(req, 'Users');

                var note = yield * notifications.createNotification(req, {
                    userFrom: newUserId,
                    userTo: newUserId,
                    body: 'Invite',
                    essenceId: essenceId,
                    entityId: newUserId,
                    notifyLevel: req.body.notifyLevel,
                    name: firstName,
                    surname: lastName,
                    company: org,
                    inviter: req.user,
                    token: activationToken,
                    subject: 'Indaba. Organization membership',
                    config: config
                },
                    'orgInvite'
                );

            } else {
                newClient = isExistUser;
            }

            return newClient;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    UOAselect: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                UserUOA.select(UOA.star())
                .from(
                    UserUOA
                    .leftJoin(UOA)
                    .on(UserUOA.UOAid.equals(UOA.id))
                )
                .where(UserUOA.UserId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    UOAadd: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                UserUOA.insert({
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UserUOA',
                entities: {
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                },
                quantity: 1,
                info: 'Add new user UOA'
            });
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },

    UOAdelete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                UserUOA.delete().where({
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UserUOA',
                entities: {
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                },
                quantity: 1,
                info: 'Delete user UOA'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    UOAdeleteMultiple: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of unit ids in request body');
            }
            var q = UserUOA.delete();
            for (var i in req.body) {
                q = q.or({
                    UserId: req.params.id,
                    UOAid: req.body[i]
                });
            }
            return yield thunkQuery(q);
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UserUOA',
                entities: data,
                quantity: data.length,
                info: 'Delete multiple users UOA'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    UOAaddMultiple: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of unit ids in request body');
            }

            var user = yield thunkQuery(User.select().where(User.id.equals(req.params.id)));
            if (!_.first(user)) {
                throw new HttpError(403, 'User with id = ' + req.params.id + ' does not exist');
            }

            var result = yield thunkQuery(UserUOA.select(UserUOA.UOAid).from(UserUOA).where(UserUOA.UserId.equals(req.params.id)));
            var existIds = result.map(function (value, key) {
                return value.UOAid;
            });
            result = yield thunkQuery(UOA.select(UOA.id).from(UOA).where(UOA.id.in(req.body)));
            var ids = result.map(function (value, key) {
                return value.id;
            });
            var insertArr = [];
            for (var i in req.body) {
                if (ids.indexOf(req.body[i]) === -1) {
                    throw new HttpError(403, 'Unit of Analisys with id = ' + req.body[i] + ' does not exist');
                }
                if (existIds.indexOf(req.body[i]) > -1) {
                    throw new HttpError(403, 'Relation for Unit of Analisys with id = ' + req.body[i] + ' has already existed');
                }
                insertArr.push({
                    UserId: req.params.id,
                    UOAid: req.body[i]
                });
            }

            return yield thunkQuery(UserUOA.insert(insertArr));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UserUOA',
                entities: data,
                quantity: data.length,
                info: 'Add new multiple users UOA'
            });
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            var groupQuery = 'array(' +
                'SELECT "UserGroups"."groupId" FROM "UserGroups" WHERE "UserGroups"."userId" = "Users"."id"' +
                ') as "usergroupId"';

            var user = yield thunkQuery(
                User
                .select(
                    User.star(),
                    req.params.realm === config.pgConnect.adminSchema ? 'null' : groupQuery
                )
                .where(User.id.equals(req.params.id))
            );
            if (!_.first(user)) {
                throw new HttpError(404, 'Not found');
            }
            return user;
        }).then(function (data) {
            res.json(User.view(_.first(data)));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var updateObj = _.pick(req.body, User.whereCol);
            var user = yield thunkQuery(User.select(User.star()).from(User).where(User.id.equals(req.params.id)));
            if (!_.first(user)) {
                throw new HttpError(404, 'Not found');
            }

            if (updateObj.password) {
                //new salt for old user if password changed
                var salt = (!_.first(user).salt) ? crypto.randomBytes(16).toString('hex') : _.first(user).salt;
                updateObj.salt = salt;
                updateObj.password = User.hashPassword(salt, updateObj.password);
            }
            if (Object.keys(updateObj).length) {
                yield thunkQuery(
                    User.update(updateObj).where(User.id.equals(req.params.id))
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'users',
                    entity: req.params.id,
                    info: 'Update user'
                });
            }
            if (req.params.realm !== config.pgConnect.adminSchema && req.body.usergroupId) {
                var userGroups4delete = yield thunkQuery(
                    UserGroup.delete().where(UserGroup.userId.equals(req.params.id)).returning('*')
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'delete',
                    object: 'userGroups',
                    entities: userGroups4delete,
                    quantity: userGroups4delete.length,
                    info: 'Delete user`s groups'
                });
                var groupObjs = [];
                for (var i in req.body.usergroupId) {
                    groupObjs.push({
                        groupId: req.body.usergroupId[i],
                        userId: req.params.id
                    });
                }
                if (groupObjs.length) {
                    yield thunkQuery(
                        UserGroup.insert(groupObjs)
                    );
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'userGroups',
                        entities: groupObjs,
                        quantity: groupObjs.length,
                        info: 'Add new groups for user'
                    });
                }
            }

        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });

    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            if (req.user.id === parseInt(req.params.id)) {
                if ((req.user.roleID === 1 && req.params.realm === 'public') || req.user.roleID !== 1) {
                    throw new HttpError(400, 'You can not remove yourself');
                }
            }
            if (req.params.realm !== 'public') {
                var adminUser = yield thunkQuery(Organization.select(Organization.adminUserId)
                    .from(Organization)
                    .where(Organization.realm.equals(req.params.realm))
                );
                if (_.first(adminUser) && _.first(adminUser).adminUserId === parseInt(req.params.id)) {
                    throw new HttpError(400, 'It does not possible delete organization`s admin');
                }
            }

            return yield thunkQuery(
                User.delete().where(User.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'users',
                entity: req.params.id,
                info: 'Delete user'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    selectSelf: function (req, res, next) {
        var thunkQuery, q;
        if (req.user.roleID === 1) { //admin
            thunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

            q = User
                .select(
                    User.star()
                )
                .from(
                    User
                )
                .where(User.id.equals(req.user.id));
        } else {
            thunkQuery = thunkify(new Query(req.params.realm));

            var rightsReq =
                'ARRAY(' +
                ' SELECT "Rights"."action" FROM "RolesRights" ' +
                ' LEFT JOIN "Rights"' +
                ' ON ("RolesRights"."rightID" = "Rights"."id")' +
                ' WHERE "RolesRights"."roleID" = "Users"."roleID"' +
                ') AS rights';
            var groupReq =
                'ARRAY(' +
                'SELECT "UserGroups"."groupId" ' +
                'FROM "UserGroups" ' +
                'WHERE "UserGroups"."userId" = "Users"."id"' +
                ') as "usergroupId"';

            var projectReq =
                '(' +
                'SELECT "Projects"."id" ' +
                'FROM "Projects" ' +
                'WHERE "Projects"."organizationId" = "Users"."organizationId" ' +
                'LIMIT 1' +
                ') as "projectId"';

            q = User
                .select(
                    User.star(),
                    rightsReq,
                    groupReq,
                    'row_to_json("Organizations".*) as organization',
                    projectReq
                )
                .from(
                    User
                    .leftJoin(Organization)
                    .on(User.organizationId.equals(Organization.id))
                )
                .where(User.id.equals(req.user.id));

        }

        co(function* () {
            return yield thunkQuery(q);
        }).then(function (data) {
            res.json(User.view(data[0]));
        }, function (err) {
            next(err);
        });
    },

    updateSelf: function (req, res, next) {
        if (req.user.roleID !== 1) { // if user is not superuser
            thunkQuery = req.thunkQuery;
        }
        co(function* () {
            var user = yield thunkQuery(User.select(User.star()).from(User).where(User.id.equals(req.user.id)));
            if (!_.first(user)) {
                throw new HttpError(404, 'Not found');
            }
            var updateObj;
            if (req.body.password) {
                if (!User.validPassword(req.user.password, _.first(user).salt, req.body.currentPassword)) {
                    throw new HttpError(400, 'Wrong current password');
                }
                //new salt for old user if password changed
                var salt = (!_.first(user).salt) ? crypto.randomBytes(16).toString('hex') : _.first(user).salt;
                updateObj = {
                    salt: salt,
                    password: User.hashPassword(salt, req.body.password)
                };
            } else {
                updateObj = _.pick(req.body, User.editCols);
            }
            var updatedData = _.first(yield thunkQuery(User.update(updateObj).where(User.id.equals(req.user.id)).returning(
                User.id,
                User.firstName,
                User.lastName,
                User.email,
                User.notifyLevel,
                User.isActive,
                User.bio
            )));
            if (updatedData) {
                return {
                    'message': 'Successfully inserted data.',
                    'data': updatedData
                };
            }

            return yield thunkQuery(User.update(updateObj).where(User.id.equals(req.user.id)));

        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'users',
                entity: req.user.id,
                info: 'Update user (self)'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    forgot: function (req, res, next) {
        co(function* () {

            if (!req.body.email) {
                throw new HttpError(400, 'Email field is required');
            }

            var userArr = [];

            var clientThunkQuery, user;
            if (req.params.realm === config.pgConnect.adminSchema) {
                var userInRealm = [];

                // search in public at first (super admin forgot password)
                user = yield * common.isExistsUserInRealm(req, config.pgConnect.adminSchema, req.body.email);
                clientThunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

                if (!user) {
                    var curRealm;
                    for (var i in req.schemas) { // search in all schemas
                        clientThunkQuery = thunkify(new Query(req.schemas[i]));
                        user = yield clientThunkQuery(
                            User
                            .select(
                                User.star(),
                                Role.name.as('role'),
                                Organization.name.as('orgName')
                            )
                            .from(
                                User
                                .leftJoin(Role)
                                .on(User.roleID.equals(Role.id))
                                .leftJoin(Organization)
                                .on(User.organizationId.equals(Organization.id))
                            )
                            .where(
                                sql.functions.UPPER(User.email).equals(req.body.email.toUpperCase())
                            )
                        );

                        if (user.length) {
                            curRealm = req.schemas[i];
                            userInRealm.push({
                                realm: req.schemas[i],
                                orgName: user[0].orgName
                            });
                            userArr.push(user[0]);
                        }
                    }
                    if (!userInRealm.length) {
                        throw new HttpError(403, 'User with this email does not exist');
                    }

                    if (userInRealm.length > 1) {
                        var result = [];
                        throw new HttpError(300, userInRealm);
                    }

                    // found just one
                    user = userArr[0];
                    // set the right schema
                    req.params.realm = curRealm;
                    clientThunkQuery = thunkify(new Query(curRealm));
                }

            } else { // certain realm
                clientThunkQuery = thunkify(new Query(req.params.realm));

                user = yield clientThunkQuery(
                    User.select().where(User.email.equals(req.body.email))
                );

                if (!user.length) {
                    throw new HttpError(403, 'User with this email does not exist');
                }
                user = user[0];
            }

            var token = yield thunkrandomBytes(32);
            token = token.toString('hex');
            var userToSave = {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 3600000
            };

            var update = yield clientThunkQuery(
                User
                .update(userToSave)
                .where(User.email.equals(req.body.email))
                .returning(User.resetPasswordToken)
            );

            req.thunkQuery = clientThunkQuery;

            bologger.log({
                req: req,
                user: user,
                action: 'update',
                object: 'users',
                entity: user.id,
                info: 'Password forgot'
            });

            if (!_.first(update)) {
                throw new HttpError(400, 'Cannot update user data');
            } else {

                var essenceId = yield * common.getEssenceId(req, 'Users');
                var notifyLevel = 2; // always send eMail
                var note = yield * notifications.createNotification(req, {
                    userFrom: user.id, // ToDo: userFrom???
                    userTo: user.id,
                    realm: req.params.realm,
                    body: 'Indaba. Restore password',
                    essenceId: essenceId,
                    entityId: user.id,
                    notifyLevel: notifyLevel,
                    name: user.firstName,
                    surname: user.lastName,
                    token: token,
                    subject: 'Indaba. Restore password',
                    config: config
                },
                    'forgot'
                );
            }
        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },
    checkRestoreToken: function (req, res, next) {
        thunkQuery = thunkify(new Query(req.params.realm));

        co(function* () {
            var user = yield thunkQuery(
                User.select().where(
                    User.resetPasswordToken.equals(req.params.token)
                    .and(User.resetPasswordExpires.gt(Date.now()))
                )
            );
            if (!_.first(user)) {
                throw new HttpError(403, 'Token expired or does not exist');
            }
            return user;
        }).then(function (user) {
            res.json(User.view(_.first(user)));
        }, function (err) {
            next(err);
        });

    },
    resetPassword: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var user = yield thunkQuery(
                User.select().where(
                    User.resetPasswordToken.equals(req.body.token)
                    .and(User.resetPasswordExpires.gt(Date.now()))
                )
            );
            if (!_.first(user)) {
                throw new HttpError(403, 'Token expired or does not exist');
            }

            //new salt for old user if password changed
            // user.registered to check if user already in system. If so, best not to use below.
            var salt = (!_.first(user).salt) ? crypto.randomBytes(16).toString('hex') : _.first(user).salt;
            var data = {
                'salt': salt,
                'password': User.hashPassword(salt, req.body.password),
                'resetPasswordToken': null,
                'resetPasswordExpires': null
            };

            return yield thunkQuery(User.update(data)
                .where(User.resetPasswordToken.equals(req.body.token))
                .returning(User.id));

        }).then(function (data) {
            bologger.log({
                req: req,
                user: _.first(data),
                action: 'update',
                object: 'users',
                entity: _.first(data).id,
                info: 'Reset password'
            });
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    tasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var tasks = yield thunkQuery(
                'SELECT "Tasks".*, "Products"."projectId", "Products"."surveyId" ' +
                'FROM "Tasks" LEFT JOIN "Products" ON "Products".id = ' +
                '"Tasks"."productId" LEFT JOIN "Projects" ON "Projects".id ' +
                '= "Products".id WHERE ' + req.user.id + ' = ANY("Tasks"."userIds")'
            );

            return tasks;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }

};

function* insertOne(req, res, next) {
    var thunkQuery = req.thunkQuery;

    if (!req.body.email || !req.body.roleID || !req.body.password || !req.body.firstName) {
        throw new HttpError(400, 'Email, password, role id and firstname fields are required');
    }

    // validate email
    if (!vl.isEmail(req.body.email)) {
        throw new HttpError(400, 101);
    }

    // validate password length
    if (!vl.isLength(req.body.password, 6, 32)) {
        throw new HttpError(400, 102);
    }

    var isExistsAdmin = yield * common.isExistsUserInRealm(req, config.pgConnect.adminSchema, req.body.email);
    if (isExistsAdmin) {
        throw new HttpError(403, 'User is an admin');
    }

    var isExistUser = yield * common.isExistsUserInRealm(req, req.params.realm, req.body.email);
    if (isExistUser) {
        isExistUser.registered = true;
        return (isExistUser);
    }

    // hash user password
    var salt = crypto.randomBytes(16).toString('hex');
    req.body.password = User.hashPassword(salt, req.body.password);

    //check user role
    if (req.body.roleID === 1 /* || req.body.roleID == 2 */ ) { // new user is admin or client
        if (!req.user || req.user.roleID !== 1) {
            throw new HttpError(403, 'You don\'t have necessary rights to create this kind of user'); // Admin and client can be created only by admin
        }
    }

    var user = yield thunkQuery(User.insert(_.extend(_.omit(req.body, 'projectId'), {
        salt: salt
    })).returning('*'));
    bologger.log({
        req: req,
        user: req.user,
        action: 'insert',
        object: 'users',
        entity: _.first(user).id,
        info: 'Add new user'
    });

    if (_.first(user)) {
        user = _.first(user);

        var essenceId = yield * common.getEssenceId(req, 'Users');
        var note = yield * notifications.createNotification(req, {
            userFrom: req.user.realmUserId,
            userTo: user.id,
            body: 'Thank you for registering at Indaba',
            essenceId: essenceId,
            entityId: user.id,
            notifyLevel: req.body.notifyLevel,
            name: req.body.firstName,
            surname: req.body.lastName,
            subject: 'Thank you for registering at Indaba',
            config: config
        },
            'welcome'
        );
    }
    return user;
}

function _createUserOnAuthService(email, password, roleId, callback) {

    let scopes = [];
    // Check if user being created is admin
    if (roleId == 1 || roleId == 2) {
        scopes = ['admin'];
    }

    const path = '/user';

    const requestOptions = {
        url: config.authService + path,
        method: 'POST',
        json: {
            username: email,
            email: email,
            password: password,
            scopes: scopes,
        }
    };
    request(requestOptions, callback);
}
