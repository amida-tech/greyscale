var _ = require('underscore'),
    crypto = require('crypto'),
    config = require('../../config'),
    common = require('../services/common'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    User = require('../models/users'),
    Organization = require('../models/organizations'),
    Token = require('../models/token'),
    vl = require('validator'),
    HttpError = require('../error').HttpError,
    UserUOA = require('../models/user_uoa'),
    UserGroup = require('../models/user_groups'),
    ProjectUser = require('../models/project_users'),
    UOA = require('../models/uoas'),
    sql = require('sql'),
    notifications = require('../controllers/notifications'),
    request = require('request-promise'),
    logger = require('../logger');

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

        }).then(function () {
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
                ).where(User.isDeleted.isNull()),
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
        co(function* () {
            var user = yield * insertOne(req, res, next);

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

            // Create user on the auth service
            // TODO: https://jira.amida-tech.com/browse/INBA-609
            var userAuthed = yield _getUserOnAuthService(req.body.email, req.headers.authorization);
            if (userAuthed.statusCode > 299) {
                userAuthed = yield _createUserOnAuthService(req.body.email, req.body.password, req.body.roleID, req.headers.authorization);
            }
            var updateObj = {
                authId: typeof userAuthed.body === 'string' ?
                    JSON.parse(userAuthed.body).id : userAuthed.body.id,
            };
            yield thunkQuery(User.update(updateObj).where(User.id.equals(user.id)));

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
            const existUser = _.first(isExist);

            const userAuthed = yield _createUserOnAuthService(existUser.email, req.body.password, existUser.roleID, req.headers.authorization);

            var data = {
                activationToken: null,
                isActive: true,
                password: User.hashPassword(existUser.salt, req.body.password),
                firstName: req.body.firstName,
                lastName: req.body.lastName
            };

            if (_.has(userAuthed, 'body.id')) { // Incase the user never exists. Code may go away.
                data.authId = userAuthed.body.id;
            }

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
                info: 'Update organization  (self)'
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

            // Check if user exists on the auth service first.
            const userExistOnAuth = yield _getUserOnAuthService(req.body.email, req.headers.authorization);

            // var isExistsAdmin = yield * common.isExistsUserInRealm(req, config.pgConnect.adminSchema, req.body.email);
            var isExistUser = yield * common.isExistsUserInRealm(req, req.params.realm, req.body.email);

            var thunkQuery = thunkify(new Query(req.params.realm));

            // Verify the organization
            var org = yield thunkQuery(
                Organization.select().where(Organization.realm.equals(req.params.realm))
            );

            if (!_.first(org)) {
                throw new HttpError(404, 'Organization not found');
            }

            org = _.first(org);

            // If a user is found in greyscale we just check to see if it's been marked as deleted and un-mark it
            if (isExistUser) {
                isExistUser.registered = true; // Indicate that the user was previously in the DB
                const updateObj = {};
                if (userExistOnAuth.statusCode === 200) {
                    const authId = typeof userExistOnAuth.body === 'string' ? JSON.parse(userExistOnAuth.body).id : userExistOnAuth.body.id;
                    if (isExistUser.authId !== authId) { // user needs authId update
                        updateObj.authId = authId;
                    }
                }
                if (isExistUser.isDeleted !== null) { // user exist and is deleted
                    updateObj.isDeleted = null;
                }

                if (!_.isEmpty(updateObj)) {
                    yield thunkQuery(User.update(updateObj).where(User.id.equals(isExistUser.id)));
                }

                // If user is in greyscale and not deleted add to project if needed
                if (req.body.projectId) {
                    yield * common.insertProjectUser(req, isExistUser.id, req.body.projectId);
                }
                return isExistUser;
            }

            // if the user didn't exist, or exists but is not active, send an invitation
            if (!isExistUser || !isExistUser.isActive) {

                const activationToken = crypto.randomBytes(32).toString('hex');
                const salt= crypto.randomBytes(16).toString('hex');
                const pass = crypto.randomBytes(5).toString('hex');

                // create the user if it doesn't exist
                let userObject = isExistUser;
                let newClient;
                if (!isExistUser) {

                    newClient = {
                        'firstName': req.body.firstName,
                        'lastName': req.body.lastName,
                        'email': req.body.email,
                        'roleID': req.body.roleID, //user
                        'salt': crypto.randomBytes(16).toString('hex'),
                        'password': User.hashPassword(salt, pass),
                        'isActive': false,
                        activationToken,
                        'organizationId': org.id,
                        'isAnonymous': req.body.isAnonymous ? true : false,
                        'notifyLevel': req.body.notifyLevel,
                        'authId': 0,
                    };

                    if (userExistOnAuth.statusCode === 200) {
                        newClient.authId = typeof userExistOnAuth.body === 'string' ? JSON.parse(userExistOnAuth.body).id : userExistOnAuth.body.id;
                    }

                    userObject = yield thunkQuery(User.insert(newClient).returning(User.id));
                    userObject = _.first(userObject);
                    newClient.id = userObject.id;

                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'users',
                        entity: userObject.id,
                        info: 'Add new user (org invite)'
                    });
                } else {
                    // set the activationToken if the user does exist
                    yield thunkQuery(User.update({activationToken}).where(User.id.equals(isExistUser.id)));
                }

                if (req.body.projectId) { // insert the user into the projectUserTable
                    yield * common.insertProjectUser(req, userObject.id, req.body.projectId);
                }

                var essenceId = yield * common.getEssenceId(req, 'Users');

                if (req.user.realmUserId !== null) {

                    yield * notifications.createNotification( req, {
                        userFrom: req.user.realmUserId,
                        userTo: userObject.id,
                        body: 'Invite',
                        essenceId,
                        entityId: userObject.id,
                        notifyLevel: req.body.notifyLevel,
                        name: req.body.firstName,
                        surname: req.body.lastName,
                        company: org,
                        inviter: req.user,
                        token: activationToken,
                        subject: 'Indaba. Organization membership',
                        config,
                    }, 'orgInvite');
                }

                if (req.body.roleID === 2) { // invite admin
                    if (!org.adminUserId) {
                        yield thunkQuery(
                                Organization.update({
                                    adminUserId: userObject.id
                                }).where(Organization.id.equals(org.id))
                            );
                    }
                }
                return newClient;
            }

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
        }).then(function () {
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
        }).then(function () {
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
                .where(User.id.equals(req.params.id)
                    .and(User.isDeleted.isNull()))
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
            var user = yield thunkQuery(
                User
                    .select(User.star()
                    )
                    .from(
                        User
                    )
                    .where(
                        User.id.equals(req.params.id)
                        .and(
                            User.isDeleted.isNull()
                        )
                    )
            );

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

            // Remove User from User Group
            yield thunkQuery(
                UserGroup.delete().where(UserGroup.userId.equals(req.params.id))
            );

            // Remove user from ProjectUsers
            yield thunkQuery(
                ProjectUser.delete().where(ProjectUser.userId.equals(req.params.id))
            );

            const user = yield thunkQuery(User.select(User.email).where(User.id.equals(req.params.id)));
            _deleteUserOnAuthService(user[0].email, req.headers.authorization);

            // Soft delete the user from the Users table
            return yield thunkQuery(
                'UPDATE "Users"' +
                ' SET "isDeleted" = (to_timestamp('+ Date.now() +
                '/ 1000.0)), ' +
                ' "isActive" = false ' +
                'WHERE "id" = ' + req.params.id
            );

        }).then(function () {
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
                .where(User.id.equals(req.user.id).and(User.isDeleted.isNull()));
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
                .where(
                    User.id.equals(req.user.id)
                    .and(
                        User.isDeleted.isNull()
                    )
                );

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
            var user = yield thunkQuery(
                User
                    .select(
                        User.star()
                    )
                    .from(
                        User
                    )
                    .where(
                        User.id.equals(req.user.id)
                            .and(
                                User.isDeleted.isNull()
                            )
                    )
            );
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
        }).then(function () {
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
                    .and(User.resetPasswordExpires.gt(Date.now())
                    .and(User.isDeleted.isNull()))
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
                    .and(User.resetPasswordExpires.gt(Date.now())
                    .and(User.isDeleted.isNull()))
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

function* insertOne(req) {
    var thunkQuery = req.thunkQuery;

    if (!req.body.email || !req.body.roleID || !req.body.password || !req.body.firstName) {
        throw new HttpError(400, 'Email, password, role id and firstname fields are required');
    }

    // validate email
    if (!vl.isEmail(req.body.email)) {
        throw new HttpError(400, 101);
    }

    // validate password length
    if (!vl.isLength(req.body.password, 8, 64)) {
        throw new HttpError(400, 102);
    }

    var isExistsAdmin = yield * common.isExistsUserInRealm(req, config.pgConnect.adminSchema, req.body.email);
    if (isExistsAdmin) {
        throw new HttpError(403, 'User is an admin');
    }

    var isExistUser = yield * common.isExistsUserInRealm(req, req.params.realm, req.body.email);
    if (isExistUser) {
        isExistUser.registered = true;
        // If user is found in table we check to see if it's been marked as deleted and un-mark it
        if (isExistUser.isDeleted !== null) {

            // make sure user is on auth before reactivating
            const userExistOnAuth = yield _getUserOnAuthService(req.body.email, req.headers.authorization);

            if (userExistOnAuth.statusCode === 200) { // User was found on auth service

                const updateObj = {
                    isDeleted: null
                };

                yield thunkQuery(
                    User.update(updateObj).where(User.email.equals(req.body.email))
                );
            } else { // User wasn't found on auth but exist in greyscale
                throw new HttpError(403, 'Couldn\'t reactivate user on greyscale because user not on auth');
            }
        }
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

    // create user on auth service
    const authUser = yield _createUserOnAuthService(req.body.email, req.body.password, req.body.roleID, req.headers.authorization);
    var userExistOnAuthBodyObject;

    if (authUser.statusCode === 200) { // user was successfully created on the auth service
        userExistOnAuthBodyObject = authUser.body; // information of newly created user

    } else { // User wasn't created on auth so user probably already exists

        const userExistOnAuth = yield _getUserOnAuthService(req.body.email, req.headers.authorization);

        if (userExistOnAuth.statusCode === 200) { // found the user on the auth service
            userExistOnAuthBodyObject = JSON.parse(userExistOnAuth.body);
        } else {
            throw new HttpError(403, 'Couldn\'t create user on greyscale and user doesn\'t exist on auth');
        }
    }

    // Insert new user into greyscale
    if (userExistOnAuthBodyObject) {
        req.body.authId = userExistOnAuthBodyObject.id;
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

function _getUserOnAuthService(email, jwt) {
    const path = '/user/byEmail/' + email;

    const requestOptions = {
        url: config.authService + path,
        method: 'GET',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        resolveWithFullResponse: true,
    };
    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res;
        })
        .catch((err) => {
            if (err.statusCode === 404) { // User wasn't found
                return err;
            }
            const httpErr = new HttpError(500, `Unable to use auth service: ${err.message}`);
            return Promise.reject(httpErr);
        });
}

function _createUserOnAuthService(email, password, roleId, jwt) {
    var scopes = [];
    // Check if user being created is admin
    if (roleId == 1 || roleId == 2) {
        scopes = ['admin'];
    }

    const path = '/user';
    const requestOptions = {
        url: config.authService + path,
        method: 'POST',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        json: {
            username: email,
            email: email,
            password: password,
            scopes: scopes,
        },
        resolveWithFullResponse: true,
    };

    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res
        })
        .catch((err) => {
            if (err.statusCode === 409) { // A 409 means a duplicate entry, so the user already exists.
                return Promise.resolve();
            }
            if (err.statusCode === 400) {
                return err;
            }
            const httpErr = new HttpError(500, `Unable to use auth service: ${err.message}`);
            return Promise.reject(httpErr);
        });
}

function _deleteUserOnAuthService(email, jwt) {
    return _getUserOnAuthService(email, jwt).then((response) => {
        if (response.statusCode !== 404) {
            const requestOptions = {
                url: `${config.authService}/user/${JSON.parse(response.body).id}`,
                method: 'DELETE',
                headers: {
                    authorization: jwt,
                    origin: config.domain
                },
                resolveWithFullResponse: true,
            }
            return request(requestOptions);
        }
    }, (error) => logger.debug(`Error deleting user from auth service ${error}`));
}
