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
    thunkify = require('thunkify'),
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
passport.use(new BasicStrategy({
        passReqToCallback: true
    },
    function (req, email, password, done) {
        query(
            User.select([User.star(), Role.name.as('role')]).from(User.leftJoin(Role).on(User.roleID.equals(Role.id))).where([sql.functions.UPPER(User.email).equals(email.toUpperCase())]),
            function (err, user) {
                if (err) {
                    return done(err);
                }
                user = user[0];
                if (!user) {
                    return done(new HttpError(401, 101));
                }
                /*if (!User.validPassword(user.password, password)) {
                    return done(new HttpError(401, 105));
                }*/
                if (!user.isActive) {
                    return done(new HttpError(401, 'You have to activate your account'));
                }
                delete user.password;
                return done(null, user);
            });
    }
));

// Register strategy for Token auth
passport.use(new TokenStrategy({
        passReqToCallback: true
    },
    function (req, tokenBody, done) {

        query(
            Token
                .select(
                    Token.star(),
                    User.star(),
                    Role.name.as('role'),
                    requestRights,
                    Project.id.as('projectId')
                )
            .from(
                Token
                .leftJoin(User).on(User.id.equals(Token.userID))
                .leftJoin(Role).on(User.roleID.equals(Role.id))
                .leftJoin(Organization).on(User.organizationId.equals(Organization.id))
                .leftJoin(Project).on(Project.organizationId.equals(Organization.id))
            )
            .where(Token.body.equals(tokenBody)),
            function (err, data) {
                if (err) {
                    return done(err);
                }
                if (!data.length) {
                    req.debug(util.format('Authentication FAILED for token: %s', tokenBody));
                    return done(null, false);
                }

                req.debug(util.format('Authentication OK for token: %s', tokenBody));
                query(
                    User.update({lastActive: new Date()}).where(User.id.equals(data[0].id)),
                    function (err, updateData) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, _.pick(data[0], User.sesInfo));
                    }
                );

            }
        );
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
