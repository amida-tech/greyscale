var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    crypto = require('crypto'),
    config = require('config'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
    Rights = require('app/models/rights'),
    RoleRights = require('app/models/role_rights'),
    WorkflowStep = require('app/models/workflow_steps'),
    EssenceRole = require('app/models/essence_roles'),
    Token = require('app/models/token'),
    Task = require('app/models/tasks'),
    Product = require('app/models/products'),
    Survey = require('app/models/surveys'),
    VError = require('verror'),
    logger = require('app/logger'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Emailer = require('lib/mailer'),
    UserUOA = require('app/models/user_uoa'),
    UOA = require('app/models/uoas');

var Role = require('app/models/roles');
var Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    thunkrandomBytes = thunkify(crypto.randomBytes);

module.exports = {
    token: function (req, res, next) {

        co(function* () {
            var needNewToken = false;
            var data = yield thunkQuery(Token.select().where({
                userID: req.user.id
            }));
            if (!data.length) {
                needNewToken = true;
            }
            if (!needNewToken && new Date(data[0].issuedAt).getTime() + config.authToken.expiresAfterSeconds < Date.now()) {
                needNewToken = true;
            }
            if (needNewToken) {
                var token = yield thunkrandomBytes(32);
                token = token.toString('hex');
                return yield thunkQuery(Token.insert({
                    'userID': req.user.id,
                    'body': token
                }).returning(Token.body));
            } else {
                return data;
            }
        }).then(function (data) {
            res.json({
                token: data[0].body
            });
        }, function (err) {
            next(err);
        });
    },

    checkToken: function (req, res, next) {
        co(function* () {
            var existToken = yield thunkQuery(Token.select().where(Token.body.equals(req.params.token)));
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
        var id = req.params.id || req.user.id;
        if (!id) {
            return next(404);
        }

        query(
            Token.delete().where(Token.userID.equals(id)),
            function (err, data) {
                if (!err) {
                    res.status(202).end();
                } else {
                    next(err);
                }
            }
        );
    },

    select: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(User.select(User.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var user = thunkQuery(User.select(), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, user];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            return yield insertOne(req, res, next);
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });

    },

    invite: function (req, res, next) {
        co(function* () {
            if (!req.body.email || !req.body.firstName || !req.body.lastName) {
                throw new HttpError(400, 'Email, First name and Last name fields are required');
            }
            if (!vl.isEmail(req.body.email)) {
                throw new HttpError(400, 101);
            }
            var isExistUser = yield thunkQuery(User.select(User.star()).where(User.email.equals(req.body.email)));
            isExistUser = _.first(isExistUser);
            if (isExistUser && isExistUser.isActive) {
                throw new HttpError(400, 'User with this email has already registered');
            }

            var OrgNameTemp = 'Your new organization';
            var firstName = isExistUser ? isExistUser.firstName : req.body.firstName;
            var lastName = isExistUser ? isExistUser.lastName : req.body.lastName;
            var activationToken = isExistUser ? isExistUser.activationToken : crypto.randomBytes(32).toString('hex');
            var pass = crypto.randomBytes(5).toString('hex');

            var userId;

            if (!isExistUser) {

                var newClient = {
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'roleID': 2, //client
                    'password': User.hashPassword(pass),
                    'isActive': false,
                    'activationToken': activationToken
                };

                userId = yield thunkQuery(User.insert(newClient).returning(User.id));

                var newOrganization = {
                    'name': OrgNameTemp,
                    'adminUserId': _.first(userId).id,
                    'isActive': false
                };

                var organizationId = yield thunkQuery(Organization.insert(newOrganization).returning(Organization.id));

                console.log(_.first(organizationId).id);

                yield thunkQuery(User.update({
                    organizationId: _.first(organizationId).id
                }).where({
                    id: _.first(userId).id
                }));
            }

            userId = isExistUser ? isExistUser.id : _.first(userId).id;

            var options = {
                to: {
                    name: firstName,
                    surname: lastName,
                    email: req.body.email,
                    subject: 'Indaba. Invite'
                },
                template: 'invite'
            };
            var data = {
                name: firstName,
                surname: lastName,
                companyName: OrgNameTemp,
                login: req.body.email,
                password: pass,
                token: activationToken
            };
            var mailer = new Emailer(options, data);
            mailer.send();

        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    checkActivationToken: function (req, res, next) {
        co(function* () {
            var isExist = yield thunkQuery(User.select(User.star()).from(User).where(User.activationToken.equals(req.params.token)));
            if (!_.first(isExist)) {
                throw new HttpError(400, 'Token is not valid');
            }
            return isExist;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    activate: function (req, res, next) {
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
                password: User.hashPassword(req.body.password),
                firstName: req.body.firstName,
                lastName: req.body.lastName
            };
            var updated = yield thunkQuery(User.update(data).where(User.activationToken.equals(req.params.token)).returning(User.id));
            return updated;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    selfOrganization: function (req, res, next) {
        co(function* () {
            if (req.user.roleID !== 2) {
                throw new HttpError(400, 'Your role is not "client". Only clients can have organization');
            }
            var Org = yield thunkQuery(Organization.select(Organization.star()).from(Organization).where(Organization.adminUserId.equals(req.user.id)));
            if (!_.first(Org)) {
                throw new HttpError(404, 'Not found');
            }
            return _.first(Org);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selfOrganizationUpdate: function (req, res, next) {
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
            var updated = yield thunkQuery(Organization.update(data).where(Organization.adminUserId.equals(req.user.id)).returning(Organization.id));
            if (!_.first(updated)) {
                throw new HttpError(404, 'Not found');
            }
            return updated;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    selfOrganizationInvite: function (req, res, next) {
        co(function* () {
            if (!req.body.email || !req.body.firstName) {
                throw new HttpError(400, 'Email and First name fields are required');
            }
            if (!vl.isEmail(req.body.email)) {
                throw new HttpError(400, 101);
            }
            var isExistUser = yield thunkQuery(User.select(User.star()).where(User.email.equals(req.body.email)));
            isExistUser = _.first(isExistUser);
            if (isExistUser && isExistUser.isActive) {
                throw new HttpError(400, 'User with this email has already registered');
            }

            var org;
            if(req.user.roleID === 1){
                org = yield thunkQuery(Organization.select().where(Organization.id.equals(req.body.organizationId)));
                org = _.first(org);
                if (!org) {
                    throw new HttpError(400, 'Organization with id = ' + req.body.organizationId + ' does not exist');
                }
            }else{
                org = yield thunkQuery(Organization.select().where(Organization.adminUserId.equals(req.user.id)));
                org = _.first(org);
                if (!org) {
                    throw new HttpError(400, 'You dont have any organizations');
                }
            }



            var firstName = isExistUser ? isExistUser.firstName : req.body.firstName;
            var lastName = isExistUser ? isExistUser.lastName : req.body.lastName;
            var activationToken = isExistUser ? isExistUser.activationToken : crypto.randomBytes(32).toString('hex');
            var pass = crypto.randomBytes(5).toString('hex');

            var newClient;
            if (!isExistUser) {
                newClient = {
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'roleID': 3, //user
                    'password': User.hashPassword(pass),
                    'isActive': false,
                    'activationToken': activationToken,
                    'organizationId': org.id
                };

                var userId = yield thunkQuery(User.insert(newClient).returning(User.id));
            }

            var options = {
                to: {
                    name: firstName,
                    surname: lastName,
                    email: req.body.email,
                    subject: 'Indaba. Organization membership'
                },
                template: 'org_invite'
            };
            var data = {
                name: firstName,
                surname: lastName,
                company: org,
                inviter: req.user,
                // login: req.body.email,
                // password: pass,
                token: activationToken
            };
            var mailer = new Emailer(options, data);

            try{
                yield function*(){
                    return yield new Promise(function(resolve, reject) {
                        mailer.send(function (err, data) {
                            console.log(err);
                            if (err) {
                                reject(err);
                            }
                            resolve(data);
                        });
                    });
                }()
            }catch(e){
                throw new HttpError(400, 'Cannot send invitation email');
            }

            return newClient;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    UOAselect: function (req, res, next) {
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
        query(UserUOA.insert({
            UserId: req.params.id,
            UOAid: req.params.uoaid
        }), function (err, user) {
            if (!err) {
                res.status(201).end();
            } else {
                next(err);
            }
        });
    },

    UOAdelete: function (req, res, next) {
        query(UserUOA.delete().where({
            UserId: req.params.id,
            UOAid: req.params.uoaid
        }), function (err, user) {
            if (!err) {
                res.status(204).end();
            } else {
                next(err);
            }
        });
    },

    UOAdeleteMultiple: function (req, res, next) {
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
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    UOAaddMultiple: function (req, res, next) {
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
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        co(function* () {
            var user = yield thunkQuery(
                User.select().where(User.id.equals(req.params.id))
            );
            if (!_.first(user)) {
                throw new HttpError(404, 'Not found');
            }
        }).then(function (data) {
            res.json(!_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        query(
            User.update(_.pick(req.body, User.whereCol)).where(User.id.equals(req.params.id)),
            function (err, data) {
                if (!err) {
                    res.status(202).end();
                } else {
                    next(err);
                }
            }
        );
    },

    deleteOne: function (req, res, next) {
        query(
            User.delete().where(User.id.equals(req.params.id)),
            function (err) {
                if (!err) {
                    res.status(204).end();
                } else {
                    next(err);
                }
            });
    },

    selectSelf: function (req, res, next) {
        var request = 'ARRAY(' +
            ' SELECT "Rights"."action" FROM "RolesRights" ' +
            ' LEFT JOIN "Rights"' +
            ' ON ("RolesRights"."rightID" = "Rights"."id")' +
            ' WHERE "RolesRights"."roleID" = "Users"."roleID"' +
            ') AS rights';
        query(User.select(User.star(), request).where(User.id.equals(req.user.id)), function (err, user) {
            if (!err) {
                res.json(_.first(user));
            } else {
                next(err);
            }
        });
    },

    updateSelf: function (req, res, next) {
        query(
            User.update(_.pick(req.body, User.editCols)).where(User.id.equals(req.user.id)),
            function (err, data) {
                if (!err) {
                    res.status(202).end();
                } else {
                    next(err);
                }
            }
        );
    },
    forgot: function (req, res, next) {
        co(function* () {
            var user = yield thunkQuery(User.select().where(User.email.equals(req.body.email)));
            if (!_.first(user)) {
                throw new HttpError(403, 'User with this email does not exist');
            } else {
                user = _.first(user);
                var token = yield thunkrandomBytes(32);
                token = token.toString('hex');
                var userToSave = {};
                userToSave.resetPasswordToken = token;
                userToSave.resetPasswordExpires = Date.now() + 3600000;

                var update = yield thunkQuery(User.update(userToSave).where(User.email.equals(req.body.email)).returning(User.resetPasswordToken));

                if (!_.first(update)) {
                    throw new HttpError(400, 'Cannot update user data');
                } else {

                    var options = {
                        to: {
                            name: user.firstName,
                            surname: user.lastName,
                            email: req.body.email,
                            subject: 'Indaba. Restore password'
                        },
                        template: 'forgot'
                    };
                    var data = {
                        name: user.firstName,
                        surname: user.lastName,
                        token: token
                    };
                    var mailer = new Emailer(options, data);
                    mailer.send();
                }
            }
        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },
    checkRestoreToken: function (req, res, next) {
        query(User.select().where(
            User.resetPasswordToken.equals(req.params.token)
            .and(User.resetPasswordExpires.gt(Date.now()))), function (err, user) {
            if (!err) {
                if (!_.first(user)) {
                    return next(new HttpError(403, 'Token expired or does not exist'));
                }
                res.json(_.last(user));
            } else {
                next(err);
            }
        });
    },
    resetPassword: function (req, res, next) {
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

            var data = {
                'password': User.hashPassword(req.body.password),
                'resetPasswordToken': null,
                'resetPasswordExpires': null
            };

            return yield thunkQuery(User.update(data)
                .where(User.resetPasswordToken.equals(req.body.token))
                .returning(User.id));

        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    tasks: function (req, res, next) {
        co(function* () {
            var res = yield thunkQuery(
                Task
                .select(
                    Task.id,
                    Task.title,
                    Task.description,
                    Task.created,
                    Task.startDate,
                    Task.endDate,
                    Task.accessToDiscussions,
                    Task.accessToResponses,
                    Task.writeToAnswers,
                    'row_to_json("UnitOfAnalysis".*) as uoa',
                    'row_to_json("Products".*) as product',
                    'row_to_json("EssenceRoles".*) as entityTypeRoleId',
                    'row_to_json("Surveys".*) as survey',
                    'row_to_json("WorkflowSteps") as step'
                )
                .from(
                    Task
                    .leftJoin(UOA)
                    .on(Task.uoaId.equals(UOA.id))
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(Survey)
                    .on(Product.surveyId.equals(Survey.id))
                    .leftJoin(EssenceRole)
                    .on(Task.entityTypeRoleId.equals(EssenceRole.id))
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))

                )
                .where(Task.entityTypeRoleId.in(
                    EssenceRole.subQuery().select(EssenceRole.id).where(EssenceRole.userId.equals(req.user.id))
                ))
            );
            return res;
        }).then(function(data) {
            res.json(data);
        }, function(err) {
            next(err);
        });
    }

};

function* insertOne(req, res, next) {
    // validate email
    if (!vl.isEmail(req.body.email)) {
        throw new HttpError(400, 101);
    }

    // validate password length
    if (!vl.isLength(req.body.password, 6, 32)) {
        throw new HttpError(400, 102);
    }

    // validate email for unique
    var email = yield thunkQuery(User.select().where(User.email.equals(req.body.email)));
    if (_.first(email)) {
        throw new HttpError(403, 103);
    }

    // hash user password
    req.body.password = User.hashPassword(req.body.password);

    //check user role
    if (req.body.roleID === 1 /* || req.body.roleID == 2 */ ) { // new user is admin or client
        if (!req.user || req.user.role !== 'admin') {
            throw new HttpError(403, 'You don\'t have necessary rights to create this kind of user'); // Admin and client can be created only by admin
        }
    }

    var user = yield thunkQuery(User.insert(req.body).returning(User.id));

    var options = {
        to: {
            name: req.body.firstName,
            surname: req.body.lastName,
            email: req.body.email,
            subject: 'Thank you for registering at Indaba'
        },
        template: 'welcome'
    };
    var data = {
        name: req.body.firstName,
        surname: req.body.lastName,
    };
    var mailer = new Emailer(options, data);
    mailer.send();

    return user;
}
