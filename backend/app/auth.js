var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    passportJWT = require("passport-jwt"),
    User = require('./models/users'),
    Role = require('./models/roles'),
    Token = require('./models/token'),
    Project = require('./models/projects'),
    Organization = require('./models/organizations'),
    EssenceRoles = require('./models/essence_roles'),
    Essences = require('./models/essences'),
    HttpError = require('./error').HttpError,
    util = require('util'),
    config = require('../config');

var ExtractJwt = passportJWT.ExtractJwt,
    JwtStrategy = passportJWT.Strategy;

var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = config.jwtSecret;
jwtOptions.passReqToCallback = true;

var Query = require('./util').Query,
    query = new Query(),
    sql = require('sql'),
    _ = require('underscore'),
    co = require('co'),
    thunkify = require('thunkify');
var thunkQuery = thunkify(query);

var Right = require('./models/rights'),
    RoleRights = require('./models/role_rights');

var requestRights = 'ARRAY(' +
    ' SELECT "Rights"."action" FROM "RolesRights" ' +
    ' LEFT JOIN "Rights"' +
    ' ON ("RolesRights"."rightID" = "Rights"."id")' +
    ' WHERE "RolesRights"."roleID" = "Users"."roleID"' +
    ') AS rights';

var debug = require('debug')('debug_auth');
debug.log = console.log.bind(console);

// Register strategy for Basic HTTP auth

// List of orgs (with namespaces) stored both in public and 'client' schemas
// Tokens stored only in 'client' schema

passport.use(new BasicStrategy({
    passReqToCallback: true
},
    function (req, email, password, done) {
        //var thunkQuery = req.thunkQuery;
        co(function* () {

            var userInNamespace = [];
            // admins records should exist only in public schema,
            // at first change schema to public, after check turn it back
            var admin = yield * checkIsAdmin(email);

            if (admin) {
                yield * checkUser(admin, password);
                return admin;
            } else {
                var user;
                if (req.params.realm === 'public') {
                    debug('Not superuser try to login to public:', email);
                    var userArr = [];

                    for (var i in req.schemas) {
                        user = yield * findUserInNamespace(req.schemas[i], email);

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

                    if (userInNamespace.length === 1) {
                        user = userArr[0];
                        yield * checkUser(user, password);
                        // set namespace to user namespace and go to users.token
                        req.params.realm = user.realm;
                        return user;
                    }

                    throw new HttpError(300, userInNamespace);

                } else { // situation after found user in several schemas and set one of them
                    user = yield * findUserInNamespace(req.params.realm, email);
                    if (!user.length) {
                        throw new HttpError(401, 101);
                    }

                    yield * checkUser(user[0], password);
                    // allready in right namespace
                    return user[0];
                }
            }

        }).then(function (user) {
            delete user.password;
            delete user.salt;
            done(null, user);
        }, function (err) {
            done(err);
        });

        function* checkIsAdmin(email) {
            var user = yield thunkQuery(
                User.select().where(
                    sql.functions.UPPER(User.email).equals(email.toUpperCase())
                    .and(User.roleID.equals(1))
                )
            );
            if (user.length) {
                return user[0];
            } else {
                return false;
            }

        }

        function* checkUser(user, password) {
            if (!User.validPassword(user.password, user.salt, password)) {
                throw new HttpError(401, 105);
            }

            if (!user.isActive) {
                throw new HttpError(401, 'You have to activate your account');
            }
        }

        function* findUserInNamespace(namespace, email) {
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

// JWT strategy for Token auth
passport.use(new JwtStrategy(jwtOptions,
    function (req, decodedJWTPayload, done) {
        co(function* () {

            var tokenBody = req.headers.authorization.split(' ')[1];

            var adminUser;

            // check if a user with the decoded payload exist in the given realm
            var user = yield thunkQuery(
                '( ' +
                'SELECT ' +
                '"Users".* ' +
                'FROM ' + req.params.realm + '."Users"' +
                'WHERE "Users"."email" = \'' + decodedJWTPayload.email  +'\'' +
                ') '
            );

            //TODO: Rather than checking the public schema, decide on how scopes from the
            //TODO: auth service will work with indaba and modify this
            if (!_.first(user)) { // user doesn't exist in the given realm
                if (req.params.realm !== config.pgConnect.adminSchema) { //look in the Public realm if the user is a superAdmin
                    const admThunkQuery = thunkify(new Query(config.pgConnect.adminSchema));
                    adminUser = yield admThunkQuery(
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
                                User.email.equals(decodedJWTPayload.email)
                            )
                    );
                    if (adminUser[0]) { // user is ok
                        // add projectId from realm
                        if (req.params.realm !== config.pgConnect.adminSchema) { // only if realm is not public
                            const clientThunkQuery = thunkify(new Query(req.params.realm));
                            var project = yield clientThunkQuery(
                                Project
                                    .select(
                                        Project.id.as('projectId')
                                    )
                                    .from(
                                        Project
                                            .leftJoin(Organization).on(Project.organizationId.equals(Organization.id))
                                    )
                            );
                            if (project[0]) {
                                adminUser[0].projectId = project[0].projectId;
                            }
                        }
                    }
                } else {
                    throw new HttpError(404, 'No user found');
                }
            }

            if (user[0]) {
                user = user[0];
            } else {
                user = adminUser[0];
            }

            // add realmUserId to user
            user.realmUserId = user.id;

            if (user.roleID === 1 && req.params.realm !== 'public') {
                // superuser
                user.realmUserId = yield * getRealmAdminId(req, req.params.realm);
                //if (!user.realmUserId) {
                //    throw new HttpError(400, 'You can`t perform this action now. First, add organization`s admin')
                //}
            }

            debug('======= TokenStrategy ======= Realm:', req.params.realm, ' User:', JSON.stringify(user));
            //debug ('userId: ', user.id, ' realmUserId:', user.realmUserId, ' realm: ', req.params.realm);

            if (!user) {
                debug(util.format('Authentication FAILED for token: %s', tokenBody));
                return false;
            }

            debug(util.format('Authentication OK for token: %s', tokenBody));

            var clientThunkQuery2 = thunkify(new Query(req.params.realm));

            yield clientThunkQuery2(
                User.update({
                    lastActive: new Date()
                })
                .where(User.id.equals(user.id))
            );

            return _.pick(user, User.sesInfo);

        }).then(function (result) {
            done(null, result);
        }, function (err) {
            done(err);
        });

        function* findToken(req, tokenBody) {

            var admThunkQuery = thunkify(new Query(config.pgConnect.adminSchema));

            var existToken = yield admThunkQuery( // select from public
                Token
                .select()
                .where(
                    Token.body.equals(tokenBody)
                    //.and(Token.realm.equals(req.params.realm))
                )
            );

            if (!existToken[0]) {
                return false;
            }

            //debug('Token realm = ' + existToken[0].realm);
            //debug('Admin schema = ' + config.pgConnect.adminSchema);

            var clientThunkQuery, data;
            if (existToken[0].realm === config.pgConnect.adminSchema) { // admin
                data = yield admThunkQuery(
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
                if (data[0]) { // user is ok
                    // add projectId from realm
                    if (req.params.realm !== config.pgConnect.adminSchema) { // only if realm is not public
                        clientThunkQuery = thunkify(new Query(req.params.realm));
                        var project = yield clientThunkQuery(
                            Project
                            .select(
                                Project.id.as('projectId')
                            )
                            .from(
                                Project
                                .leftJoin(Organization).on(Project.organizationId.equals(Organization.id))
                            )
                        );
                        if (project[0]) {
                            data[0].projectId = project[0].projectId;
                        }

                    }
                }
            } else {
                if (existToken[0].realm === req.params.realm) {
                    clientThunkQuery = thunkify(new Query(req.params.realm));
                    data = yield clientThunkQuery(
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
                } else { // try to auth with token from other realm
                    return false;
                }

            }

            return (data[0] ? data[0] : false);

        }

        function* getRealmAdminId(req, realm) {
            var clientThunkQuery = thunkify(new Query(realm));
            var data = yield clientThunkQuery(Organization.select(Organization.adminUserId).from(Organization).where(Organization.realm.equals(realm)));
            return (data[0] ? data[0].adminUserId : null);

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

                    //debug('Authenticate if possible:', JSON.stringify(user));

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
                debug(util.format('Authorization OK for: %s, as: %s', req.user.email, req.user.role));
                next();
            } else {
                debug(util.format('Authorization FAILED for: %s, as: %s', req.user.email, req.user.role));
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

    checkRight: function (action) {
        return function (req, res, next) {
            var thunkQuery = req.thunkQuery;
            if (!action) {
                next(new HttpError(400, 'Bad action!'));
            }
            if ((req.user.roleID === 1) || (req.user.roleID === 2)) { // super admin or admin
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

            }).then(function () {
                next();
            }, function (err) {
                next(err);
            });
        };
    }
};
