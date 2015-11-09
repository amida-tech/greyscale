var passport = require('passport'),
  BasicStrategy = require('passport-http').BasicStrategy,
  TokenStrategy = require('lib/passport_token'),
  client = require('app/db_bootstrap'),
  User = require('app/models/user'),
  Role = require('app/models/role'),
  Token = require('app/models/token'),
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
passport.use(new BasicStrategy(
  {passReqToCallback: true},
  function (req, email, password, done) {
    query(
      User.select([User.star(), Role.name.as('role')]).from(User.leftJoin(Role).on(User.roleID.equals(Role.id))).where([User.email.equals(email)]),
      function (err, user) {
        if (err) {
          return done(err);
        }
        user = user[0];
        if (!user) {
          return done(new HttpError(401, 101));
        }
        if (!User.validPassword(user.password, password)) {
          return done(new HttpError(401, 105));
        }
        delete user.password;
        return done(null, user);
      });
  }
));

// Register strategy for Token auth
passport.use(new TokenStrategy(
  {passReqToCallback: true},
  function (req, tokenBody, done) {

    query(
      Token.select(Token.star(), User.star(), Role.name.as('role'), requestRights)
        .from(
        Token
          .leftJoin(User).on(User.id.equals(Token.userID))
          .leftJoin(Role).on(User.roleID.equals(Role.id))
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
        // if (new Date(data[0].issuedAt).getTime() + config.authToken.expiresAfterSeconds < Date.now()) {
        //   req.debug(util.format('Authentication FAILED for token: %s', tokenBody));
        //   return done(null, false);
        // }
        req.debug(util.format('Authentication OK for token: %s', tokenBody));
        return done(null, _.pick(data[0], User.sesInfo));
      }
    );
  }
));

module.exports = {
  authenticate: function (strategy) {
    return {
      always: passport.authenticate(strategy, {session: false}),
      ifPossible: function (req, res, next) {
        passport.authenticate(strategy, {session: false}, function (err, user, info) {
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
        success = req.user.role == role;
      }
      if (success) {
        req.debug(util.format('Authorization OK for: %s, as: %s', req.user.email, req.user.role));
        next();
      } else {
        req.debug(util.format('Authorization FAILED for: %s, as: %s', req.user.email, req.user.role));
        next(new HttpError(401, "User's role has not permission for this action")); // Unauthorized.
      }
    }
  },
  checkUserRight: function (action, user){
      if (user.role == config.admin_role) {
        return true;
      } else if (_.indexOf(user.rights, action) > -1) {
        return true;
      } else {
        return false;
      }
      
  },
  checkRight: function (action) {
    return function (req, res, next) {

      if (!action) {
        next(new HttpError(400, "Bad action!"));
      }
      if (req.user.role == config.admin_role) {
        return next();
      }

      co(function* () {
        var query = Right
          .select(RoleRights.star())
          .from(
          Right.leftJoin(RoleRights).on(Right.id.equals(RoleRights.rightID))
        )
        var strAction = action;
        if(Array.isArray(action)){
          query.where(Right.action.in(action), RoleRights.roleID.equals(req.user.roleID));
          strAction = action.join(", ");
        }else{
          query.where(Right.action.equals(action), RoleRights.roleID.equals(req.user.roleID));
        }

        var data = yield thunkQuery(query);

        if (!data.length) {
          throw new HttpError(401, "User's role has not permission for this action(s): "+strAction);
          next(err);
        }else{
          return data;
        }

      }).then(function (data) {
          next();
      }, function (err) {
        next(err);
      });
    }
  }
};
