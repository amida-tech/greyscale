var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    crypto = require('crypto'),
    config = require('config'),
    User = require('app/models/users'),
    Organization = require('app/models/organizations'),
    Rights = require('app/models/rights'),
    RoleRights = require('app/models/role_rights'),
    WorkflowStep = require('app/models/workflow_steps'),
    Discussion = require('app/models/discussions'),
    Token = require('app/models/token'),
    Task = require('app/models/tasks'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    Project = require('app/models/projects'),
    Survey = require('app/models/surveys'),
    VError = require('verror'),
    logger = require('app/logger'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Emailer = require('lib/mailer'),
    UserUOA = require('app/models/user_uoa'),
    UserGroup = require('app/models/user_groups'),
    UOA = require('app/models/uoas'),
    Notification = require('app/models/notifications'),
    Essence = require('app/models/essences'),
    notifications = require('app/controllers/notifications');

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
                userID : req.user.id,
                realm  : req.params.realm
            }));
            if (!data.length) {
                needNewToken = true;
            }
            //if (!needNewToken && new Date(data[0].issuedAt).getTime() + config.authToken.expiresAfterSeconds < Date.now()) {
            //    needNewToken = true;
            //}
            if (needNewToken) {
                var token = yield thunkrandomBytes(32);
                token = token.toString('hex');
                var record = yield thunkQuery(Token.insert({
                    userID : req.user.id,
                    body   : token,
                    realm  : req.params.realm
                }).returning(Token.body));
                return record;
            } else {
                return data;
            }
        }).then(function (data) {
            res.json({
                token: data[0].body,
                realm: req.params.realm
            });
        }, function (err) {
            next(err);
        });
    },

    checkToken: function (req, res, next) {
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
        co(function*(){
            if (!req.params.id && !req.user.id) {
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

        }).then(function(){
            res.status(202).end();
        }, function(err){
            next(err);
        });

    },

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(User.select(User.count('counter')), req.query);
            var user = thunkQuery(
                User.select(
                    User.star(),
                    'array(' +
                    'SELECT "UserGroups"."groupId" FROM "UserGroups" WHERE "UserGroups"."userId" = "Users"."id"' +
                    ') as "usergroupId"'
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
            return yield insertOne(req, res, next);
        }).then(function (data) {
            res.status(201).json(User.view(_.first(data)));
        }, function (err) {
            next(err);
        });

    },

    invite: function (req, res, next) { // TODO realm?
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

                // TODO creates project in background, may be need to disable in future
                yield thunkQuery(
                    Project.insert(
                        {
                            organizationId: organizationId[0].id,
                            codeName: 'Org_' + organizationId[0].id + '_project'
                        }
                    )
                );

                yield thunkQuery(User.update({
                    organizationId: _.first(organizationId).id
                }).where({
                    id: _.first(userId).id
                }));
            }

            userId = isExistUser ? isExistUser.id : _.first(userId).id;

            var essenceId = yield * getEssenceId(req, 'Users');
            var notifyLevel = 2; // ToDo: Default - need specify notifyLevel in frontend
            var note = yield * notifications.createNotification(req,
                {
                    userFrom: req.user.id,
                    userTo: userId,
                    body: 'Invite',
                    essenceId: essenceId,
                    entityId: userId,
                    notifyLevel: notifyLevel,
                    name: firstName,
                    surname: lastName,
                    companyName: OrgNameTemp,
                    login: req.body.email,
                    password: pass,
                    token: activationToken,
                    subject: 'Indaba. Invite',
                    config: config
                },
                'invite'
            );

/*
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
*/

        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    checkActivationToken: function (req, res, next) {  // TODO realm?
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

    activate: function (req, res, next) {  // TODO realm?
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
            res.json(User.view(_.first(data)));
        }, function (err) {
            next(err);
        });
    },

    selfOrganization: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var org = false;

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
            return updated;
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    selfOrganizationInvite: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.body.roleID == 1) {
                throw new HttpError(400, 'Superadmin user cannot be created');
            }

            if (req.body.roleID > 3) {
                throw new HttpError(400, 'Role does not exist');
            }

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
            var newUserId = isExistUser ? isExistUser.id : 0;
            if (!isExistUser) {
                newClient = {
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'roleID': req.body.roleID, //user
                    'password': User.hashPassword(pass),
                    'isActive': false,
                    'activationToken': activationToken,
                    'organizationId': org.id,
                    'isAnonymous' : req.body.isAnonymous ? true : false
                };

                var userId = yield thunkQuery(User.insert(newClient).returning(User.id));
                newUserId = userId[0].id;
            }

            var essenceId = yield * getEssenceId(req, 'Users');
            var notifyLevel = 2; // ToDo: Default - need specify
            var note = yield * notifications.createNotification(req,
                {
                    userFrom: req.user.id,
                    userTo: newUserId,
                    body: 'Invite',
                    essenceId: essenceId,
                    entityId: newUserId,
                    notifyLevel: notifyLevel,
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
/*

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
*/

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

        co(function*(){
            return yield thunkQuery(
                UserUOA.insert({
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function(data){
            res.status(201).end();
        }, function(err){
            next(err);
        });

    },

    UOAdelete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                UserUOA.delete().where({
                    UserId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function(data){
            res.status(204).end();
        }, function(){
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
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var user = yield thunkQuery(
                User
                    .select(
                        User.star(),
                        'array(' +
                        'SELECT "UserGroups"."groupId" FROM "UserGroups" WHERE "UserGroups"."userId" = "Users"."id"' +
                        ') as "usergroupId"'
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
        co(function*(){
            var updateObj = _.pick(req.body, User.whereCol);
            if(updateObj.password){
                updateObj.password = User.hashPassword(updateObj.password);
            }
            if (Object.keys(updateObj).length) {
                yield thunkQuery(
                    User.update(updateObj).where(User.id.equals(req.params.id))
                );
            }
            yield thunkQuery(
                UserGroup.delete().where(UserGroup.userId.equals(req.params.id))
            );
            var groupObjs = [];
            for (var i in req.body.usergroupId) {
                groupObjs.push(
                    {
                        groupId : req.body.usergroupId[i],
                        userId  : req.params.id
                    }
                );
            }
            if (groupObjs.length) {
                yield thunkQuery(
                    UserGroup.insert(groupObjs)
                );
            }
        }).then(function(){
            res.status(202).end();
        }, function(err){
            next(err);
        });

    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* (){
            return yield thunkQuery(
                User.delete().where(User.id.equals(req.params.id))
            );
        }).then(function(data){
            res.status(204).end();
        }, function(err){
            next(err);
        });

    },

    selectSelf: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){

            if (req.user.roleID == 1) {
                app.locals.realm = 'public';
            }

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

            return yield thunkQuery(
                User
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
                .where(User.id.equals(req.user.id))
            );
        }).then(function (data) {
            res.json(User.view(data[0]));
        }, function (err) {
            next(err);
        });
    },

    updateSelf: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var updateObj;
            if(req.body.password){
                if (!User.validPassword(req.user.password, req.body.currentPassword)) {
                    throw new HttpError(400, 'Wrong current password');
                }
                updateObj = {
                    password: User.hashPassword(req.body.password)
                };
            } else {
                updateObj = _.pick(req.body, User.editCols);
            }

            return yield thunkQuery(User.update(updateObj).where(User.id.equals(req.user.id)));

        }).then(function(){
            res.status(202).end();
        }, function(err){
            next(err);
        });
    },
    forgot: function (req, res, next) { //TODO realm??
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

                    var essenceId = yield * getEssenceId(req, 'Users');
                    var notifyLevel = 2; // ToDo: Default - need specify notifyLevel in frontend
                    var note = yield * notifications.createNotification(req,
                        {
                            userFrom: user.id,  // ToDo: userFrom???
                            userTo: user.id,
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

/*
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
*/
                }
            }
        }).then(function (data) {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },
    checkRestoreToken: function (req, res, next) { // TODO realm???
        co(function* (){
            var user = yield thunkQuery(
                User.select().where(
                    User.resetPasswordToken.equals(req.params.token)
                    .and(User.resetPasswordExpires.gt(Date.now()))
                )
            );
            if (!_.first(user)) {
                throw new HttpError(403, 'Token expired or does not exist');
            }
        }).then(function(user){
            res.json(User.view(_.first(user)));
        }, function(err){
            next(err);
        });

    },
    resetPassword: function (req, res, next) { // TODO realm???
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var curStepAlias = 'curStep';
            var res = yield thunkQuery(
                Task
                .select(
                    Task.id,
                    Task.title,
                    Task.description,
                    Task.created,
                    Task.startDate,
                    Task.endDate,
                    'row_to_json("UnitOfAnalysis".*) as uoa',
                    'row_to_json("Products".*) as product',
                    'row_to_json("Projects".*) as project',
                    'row_to_json("Surveys".*) as survey',
                    'row_to_json("WorkflowSteps") as step',
                    'CASE ' +
                        'WHEN (' +
                            'SELECT ' +
                            '"Discussions"."id" ' +
                            'FROM "Discussions" ' +
                            'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                            'AND "Discussions"."isReturn" = true ' +
                            'AND "Discussions"."isResolve" = false ' +
                            'LIMIT 1' +
                        ') IS NULL ' +
                        'THEN FALSE ' +
                        'ELSE TRUE ' +
                    'END as flagged',
                    'CASE ' +
                        'WHEN ' +
                            '("' + curStepAlias + '"."position" > "WorkflowSteps"."position") ' +
                            'OR ("ProductUOA"."isComplete" = TRUE) ' +
                        'THEN \'completed\' ' +
                        'WHEN (' +
                            '"' + curStepAlias + '"."position" IS NULL ' +
                            'AND ("WorkflowSteps"."position" = 0) ' +
                            'AND ("Products"."status" = 1)' +
                        ')' +
                        'OR (' +
                            '"' + curStepAlias + '"."position" = "WorkflowSteps"."position" ' +
                            'AND ("Products"."status" = 1)' +
                        ')' +
                        'THEN \'current\' ' +
                        'ELSE \'waiting\'' +
                    'END as status '
                )
                .from(
                    Task
                    .leftJoin(UOA)
                    .on(Task.uoaId.equals(UOA.id))
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(Project)
                    .on(Product.projectId.equals(Project.id))
                    .leftJoin(Survey)
                    .on(Product.surveyId.equals(Survey.id))
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))
                    .leftJoin(ProductUOA)
                    .on(
                        ProductUOA.productId.equals(Task.productId)
                            .and(ProductUOA.UOAid.equals(Task.uoaId))
                    )
                    .leftJoin(WorkflowStep.as(curStepAlias))
                    .on(
                        ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                    )
                )
                .where(
                    Task.userId.equals(req.user.id)
                    //.and(Project.status.equals(1))
                    .and(Product.status.equals(1))
                ), req.query
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
    var thunkQuery = req.thunkQuery;
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
        if (!req.user || req.user.roleID !== 1) {
            throw new HttpError(403, 'You don\'t have necessary rights to create this kind of user'); // Admin and client can be created only by admin
        }
    }

    var user = yield thunkQuery(User.insert(req.body).returning(User.id));

    if (_.first(user)) {
        user = _.first(user);

        var essenceId = yield * getEssenceId(req, 'Users');
        var notifyLevel = 2; // ToDo: Default - need specify notifyLevel in frontend
        var note = yield * notifications.createNotification(req,
            {
                userFrom: user.id,  // ToDo: userFrom???
                userTo: user.id,
                body: 'Thank you for registering at Indaba',
                essenceId: essenceId,
                entityId: user.id,
                notifyLevel: notifyLevel,
                name: req.body.firstName,
                surname: req.body.lastName,
                subject: 'Thank you for registering at Indaba',
                config: config
            },
            'welcome'
        );
    }
/*
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
        surname: req.body.lastName
    };
    var mailer = new Emailer(options, data);
    mailer.send();
*/

    return user;
}

function* getEssenceId(req, essenceName) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Essence.select().where(Essence.tableName.equals(essenceName))
    );
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Essence `'+essenceName+'"');
    }
    return result[0].id;
}
