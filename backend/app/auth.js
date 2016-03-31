var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    TokenStrategy = require('lib/passport_token'),
    client = require('app/db_bootstrap'),
    User = require('app/models/users'),
    Role = require('app/models/roles'),
    Token = require('app/models/token'),
    Project = require('app/models/projects'),
    Organization = require('app/models/organizations'),
    EssenceRoles = require('app/models/essence_roles'),
    AccessPermission = require('app/models/access_permissions'),
    Essences = require('app/models/essences'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    config = require('config');

var Query = require('app/util').Query,
    query = new Query(),
    sql = require('sql'),
    _ = require('underscore'),
    co = require('co'),
    thunkify = require('thunkify');
    thunkQuery = thunkify(query);

var Right = require('app/models/rights'),
    RoleRights = require('app/models/role_rights'),
    UserRights = false;

var requestRights = 'ARRAY(' +
    ' SELECT "Rights"."action" FROM "RolesRights" ' +
    ' LEFT JOIN "Rights"' +
    ' ON ("RolesRights"."rightID" = "Rights"."id")' +
    ' WHERE "RolesRights"."roleID" = "Users"."roleID"' +
    ') AS rights';

// Register strategy for Basic HTTP auth

// List of orgs (with namespaces) stored both in public and 'client' schemas
// Tokens stored only in 'client' schema


passport.use(new BasicStrategy({
        passReqToCallback: true
    },
    function (req, email, password, done) {
        //var thunkQuery = req.thunkQuery;
        co(function* (){

            var userInNamespace = [];
            // admins records should exist only in public schema,
            // at first change schema to public, after check turn it back
            var admin = yield *checkIsAdmin(email);

            if (admin) {
                yield * checkUser(admin, password);
                return admin;
            } else {
                if (req.params.realm == 'public') {

                    var userArr = [];

                    for (var i in req.schemas) { // TODO STORE salt for each client somewhere ???
                        var user = yield * findUserInNamespace(req.schemas[i], email);
                        console.log(user);
                        if (user[0]) {
                            userInNamespace.push({
                                realm: req.schemas[i],
                                orgName: user[0].orgName
                            });
                            user[0].realm = req.schemas[i];
                            userArr.push(user[0]);
                        }
                    }

                    if (!userInNamespace.length) {
                        throw new HttpError(401, 101);
                    }

                    if (userInNamespace.length == 1) {
                        user = userArr[0];
                        yield * checkUser(user, password);
                        // set namespace to user namespace and go to users.token
                        req.params.realm = user.realm;
                        return user;
                    }

                    throw new HttpError(300, userInNamespace);

                } else { // situation after found user in several schemas and set one of them
                    var user = yield * findUserInNamespace(req.params.realm, email);
                    if (!user.length) {
                        throw new HttpError(401, 101);
                    }

                    yield * checkUser(user[0], password);
                    // allready in right namespace
                    return user[0];
                }
            }


        }).then(function(user){
            delete user.password;
            done(null, user);
        }, function(err){
            done(err);
        });

        function *checkIsAdmin (email){

            var user =  yield thunkQuery(
                User.select().where(
                    {
                        roleID : 1,
                        email : email
                    }
                )
            );

            if(user.length){
                return user[0];
            } else {
                return false;
            }

        }

        function *checkUser (user, password){
            if (!User.validPassword(user.password, password)) {
                throw new HttpError(401, 105);
            }

            if (!user.isActive) {
                throw new HttpError(401, 'You have to activate your account')
            }
        }

        function *findUserInNamespace (namespace, email){
            var thunkQuery = thunkify(new Query(namespace));
            return yield thunkQuery(
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
                            .join(Organization)
                            .on(User.organizationId.equals(Organization.id))
                    )
                    .where(
                        sql.functions.UPPER(User.email).equals(email.toUpperCase())
                    )
            );

        }

    }
));

// Register strategy for Token auth
passport.use(new TokenStrategy({
        passReqToCallback: true
    },
    function (req, tokenBody, done) {

        co(function* (){

            // we are looking for all tokens only in public schema
            try{
                var user = yield* findToken(req, tokenBody);
            }catch(err){
                throw new HttpError(500, 'Database error '+err);
            }

            console.log(user);

            if (!user) {
                req.debug(util.format('Authentication FAILED for token: %s', tokenBody));
                return false;
            }

            req.debug(util.format('Authentication OK for token: %s', tokenBody));

            yield thunkQuery(
                User.update(
                    {
                        lastActive: new Date()
                    }
                )
                .where(User.id.equals(user.id))
            )

            return _.pick(user, User.sesInfo);

        }).then(function(result) {
            done(null, result);
        }, function(err) {
            done(err);
        });

        function * findToken(req, tokenBody){

            var admThunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

            var clientThunkQuery = thunkify(new Query(req.params.realm));

            var existToken = yield admThunkQuery( // select from public
                Token
                    .select()
                    .where(
                        Token.body.equals(tokenBody)
                        //.and(Token.realm.equals(req.params.realm))
                    )
            );

            if(!existToken[0]) {
                return false;
            }

            if (existToken[0].realm == config.pgConnect.adminSchema) { // admin
                var data =  yield admThunkQuery(
                    User
                        .select(
                            User.star(),
                            Role.name.as('role')
                        )
                        .from(
                            User
                            .leftJoin(Role)
                            .on(User.roleID.equals(Role.id))
                        )
                        .where(
                            User.id.equals(existToken[0].userID)
                        )
                );
            } else {
                if (existToken[0].realm == req.params.realm) {
                    var data =  yield clientThunkQuery(
                        User
                            .select(
                                User.star(),
                                Role.name.as('role'),
                                requestRights,
                                Project.id.as('projectId')
                            )
                            .from(
                                User
                                    .leftJoin(Role).on(User.roleID.equals(Role.id))
                                    .leftJoin(Organization).on(User.organizationId.equals(Organization.id))
                                    .leftJoin(Project).on(Project.organizationId.equals(Organization.id))
                            )
                            .where(
                                User.id.equals(existToken[0].userID)
                            )
                    );
                } else { // try to auth realm with token from other realm
                    return false;
                }

            }

            return (data[0] ? data[0] : false);

        }

    }
));

module.exports = {
    authenticate: function (strategy) {
        return {
            always: passport.authenticate(strategy, {
                session: false
            }),
            ifPossible: function (req, res, next) {
                passport.authenticate(strategy, {
                    session: false
                }, function (err, user, info) {

                    console.log(user);

                    if (user) {
                        req.user = user;
                    }
                    if (info) {
                        req.userInfo = info;
                    }
                    next(err);
                })(req, res, next);
            }
        };
    },
    authorize: function (role) {
        return function (req, res, next) {
            var success = false;
            if (Array.isArray(role)) {
                success = role.indexOf(req.user.role) > -1;
            } else {
                success = req.user.role === role;
            }
            if (success) {
                req.debug(util.format('Authorization OK for: %s, as: %s', req.user.email, req.user.role));
                next();
            } else {
                req.debug(util.format('Authorization FAILED for: %s, as: %s', req.user.email, req.user.role));
                next(new HttpError(401, 'User\'s role has not permission for this action')); // Unauthorized.
            }
        };
    },
    checkUserRight: function (action, user) {
        if (user.role === config.adminRole) {
            return true;
        } else if (_.indexOf(user.rights, action) > -1) {
            return true;
        } else {
            return false;
        }

    },

    checkAdmin: function (user) {
        return (user.role === config.adminRole || user.role === config.clientRole);
    },

    checkPermission: function (action) {
        return function (req, res, next) {
            var thunkQuery = req.thunkQuery;
            co(function* () {

                if (req.user.roleID === 1) {
                    return true;
                }

                var Action = yield thunkQuery(Right.select(Right.star()).from(Right).where(Right.action.equals(action)));
                Action = _.first(Action);
                if (typeof Action === 'undefined') {
                    return true;
                }

                var Essence = yield thunkQuery(Essences.select(Essences.star()).from(Essences).where(Essences.id.equals(Action.essenceId)));
                Essence = _.first(Essence);
                if (!Essence) {
                    throw new HttpError(403, 'Essence does not exist: ' + Action.essenceId);
                }

                var model;
                try {
                    model = require('app/models/' + Essence.fileName);
                } catch (err) {
                    throw new HttpError(403, 'Cannot find model file: ' + Essence.fileName);
                }

                var Membership = yield thunkQuery(
                    EssenceRoles
                    .select(EssenceRoles.roleId)
                    .from(EssenceRoles)
                    .where(
                        EssenceRoles.essenceId.equals(Essence.id)
                        .and(EssenceRoles.entityId.equals(req.params.id))
                        .and(EssenceRoles.userId.equals(req.user.id))
                    )
                );
                Membership = _.first(Membership);

                if (!Membership) {
                    throw new HttpError(403, 'This user does not have membership on this entity');
                }

                var Matrix = yield thunkQuery(model.select(model.matrixId).where(model.id.equals(req.params.id))); // TODO subquery
                Matrix = _.first(Matrix);

                var Permissions = yield thunkQuery(
                    AccessPermission
                    .select(AccessPermission.star())
                    .from(AccessPermission)
                    .where(
                        AccessPermission.matrixId.equals(Matrix.matrixId)
                        .and(AccessPermission.roleId.equals(Membership.roleId))
                        .and(AccessPermission.rightId.equals(Action.id))
                    )
                );
                if (!_.first(Permissions)) {
                    throw new HttpError(401, 'User\'s role has not permission for this action');
                }
                return Permissions;
            }).then(function (data) {
                next();
            }, function (err) {
                next(err);
            });
        };
    },

    checkRight: function (action) {
        return function (req, res, next) {
            var thunkQuery = req.thunkQuery;
            if (!action) {
                next(new HttpError(400, 'Bad action!'));
            }
            if (req.user.role === config.adminRole) {
                return next();
            }

            co(function* () {
                var query = Right
                    .select(RoleRights.star())
                    .from(
                        Right.leftJoin(RoleRights).on(Right.id.equals(RoleRights.rightID))
                    );
                var strAction = action;
                if (Array.isArray(action)) {
                    query.where(Right.action.in(action), RoleRights.roleID.equals(req.user.roleID));
                    strAction = action.join(', ');
                } else {
                    query.where(Right.action.equals(action), RoleRights.roleID.equals(req.user.roleID));
                }

                var data = yield thunkQuery(query);

                if (!data.length) {
                    next(new HttpError(401, 'User\'s role has not permission for this action(s): ' + strAction));
                } else {
                    return data;
                }

            }).then(function (data) {
                next();
            }, function (err) {
                next(err);
            });
        };
    }
};
