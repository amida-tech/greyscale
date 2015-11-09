var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  crypto = require('crypto'),
  config = require('config'),
  User = require('app/models/user'),
  Rights = require('app/models/rights'),
  RoleRights = require('app/models/role_rights'),
  Token = require('app/models/token'),
  VError = require('verror'),
  logger = require('app/logger'),
  vl = require('validator'),
  HttpError = require('app/error').HttpError,
  util = require('util'),
  async = require('async');

var Role = require('app/models/role');
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
        var data = yield thunkQuery(Token.select().where({userID: req.user.id}));
        if (!data.length) {
          needNewToken = true;
        }
        if (!needNewToken && new Date(data[0].issuedAt).getTime() + config.authToken.expiresAfterSeconds < Date.now()) {
          needNewToken = true;
        }
        if (needNewToken) {
          var token = yield thunkrandomBytes(32);
          token = token.toString('hex');
          return yield thunkQuery(Token.insert({'userID': req.user.id, 'body': token}).returning(Token.body))
        }
        else {
          return data;
        }
      }
    ).then(function (data) {
        res.json({token: data[0].body});
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
        }
        else {
          next(err);
        }
      }
    );
  },

  select: function (req, res, next) {
    co(function* () {
      var _counter = thunkQuery(User.select(User.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
      var user = thunkQuery(User.select(), req.query);
      return yield [_counter, user];
    }).then(function (data) {
      res.set('X-Total-Count', _.first(data[0]).counter);
      res.json(_.last(data));
    }, function (err) {
      next(err);
    });
  },

  insertOne: function (req, res, next) {
    co(function *() {
        return yield insertOne(req, res, next);
      }
    ).then(function (data) {
        res.status(201).json(_.first(data));
      }, function (err) {
        next(err);
      });

  },

  selectOne: function (req, res, next) {
    query(User.select().where(req.params), function (err, user) {
      if (!err) {
        res.json(_.first(user));
      } else {
        next(err);
      }
    });
  },

  updateOne: function (req, res, next) {
    // dont allow users to update password like this, move to another procedure
    delete req.body.password;
    query(
      User.update(req.body).where(User.id.equals(req.params.id)),
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
      User.update(req.body).where(User.id.equals(req.user.id)),
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
          var subject = "TripWeCan. Restore password";
          var recipient = {'email': req.body.email, 'name': user.firstName + " " + user.lastName};

          var template = 'password-reset';
          var vars = [
            {
              "name": "token",
              "content": token
            },
            {
              "name": "name",
              "content": recipient.name
            }
          ];
          console.log(vars);
          //Mailer.send(subject, recipient, template, vars); TODO send nodemailer mail
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
        .and(User.resetPasswordExpires.gt(Date.now())
      )), function (err, user) {
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
      }

      return yield thunkQuery(User.update(data)
        .where(User.resetPasswordToken.equals(req.body.token))
        .returning(User.id));


    }).then(function (data) {
      res.status(200).end();
    }, function (err) {
      next(err);
    });
  },
  orders: function (req, res, next) {
    co(function* () {
      if (req.user.id != req.params.id && req.user.role != 'admin' && !req.user.rights.orders_view_all) {
        throw new HttpError(403, 'You do not have permission to perform this action');
      }


      var _counter = thunkQuery(Order.select(Order.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
      var order = thunkQuery(Order.select().where(Order.clientID.equals(req.params.id)), req.query);
      return yield [_counter, order];
    }).then(function (data) {
      res.set('X-Total-Count', _.first(data[0]).counter);
      res.json(_.last(data));
    }, function (err) {
      next(err);
    });
  },

  authFaceBook: function (req, res, next) {
    if (req.user) {
      return next();
    }
    if (req.userInfo) {
      // create user
      co(function *() {
          // if user alreary exists
          var user_upd = yield thunkQuery(
                            User.update({
                              "facebookID": req.userInfo.id,
                              "facebookDetails": req.userInfo
                            })
                            .where(User.email.equals(req.userInfo.email))
                            .returning(User.id));
          if (user_upd.length) {
            return user_upd;
          }

          // new user
          var password = yield thunkrandomBytes(8);
          password = password.toString('hex');
          req.body = {
            "firstName": req.userInfo.first_name,
            "lastName": req.userInfo.last_name,
            "email": req.userInfo.email,
            "roleID": "3", // TODO save at config.js
            "password": password,
            "facebookID": req.userInfo.id,
            "facebookDetails": req.userInfo
          };
          return yield insertOne(req, res, next);
        }
      ).then(function (data) {
          //res.status(201).json(_.first(data));
          req.user = _.first(data);
          return next();
        }, function (err) {
          next(err);
        });
      //res.json(req.userInfo);
    }
    else {
      return next(new HttpError(400, 'Auth facebook error!'));
    }
  }
  /*venues: function (req, res, next) {
   try {
   var id = new ObjectId(req.params.id);
   }
   catch (e) {
   return next(404);
   }
   User
   .findOne({_id: id})
   .select('venue')
   .populate({
   path: 'venue',
   match: req.mngs.q,
   select: req.mngs.f,
   options: req.mngs.opt
   })
   .exec(function (err, user) {
   if (!err) {
   res.json(user);
   }
   else {
   next(err);
   }
   })

   },*/
  /*events: function (req, res, next) {
   try {
   var id = new ObjectId(req.params.id);
   }
   catch (e) {
   return next(404);
   }
   User
   .findOne({_id: id})
   .select('event')
   .populate({
   path: 'event',
   match: req.mngs.q,
   select: req.mngs.f,
   options: req.mngs.opt
   })
   .exec(function (err, user) {
   if (!err) {
   res.json(user);
   }
   else {
   next(err);
   }
   })

   },*/
  /*events_created: function (req, res, next) {
   try {
   var id = new ObjectId(req.params.id);
   }
   catch (e) {
   return next(404);
   }
   User
   .findOne({_id: id})
   .select('event_created')
   .populate({
   path: 'event',
   match: req.mngs.q,
   select: req.mngs.f,
   options: req.mngs.opt
   })
   .exec(function (err, user) {
   if (!err) {
   res.json(user);
   }
   else {
   next(err);
   }
   })

   },*/


  /*recovery: function (req, res, next) {  // TODO log method
   User
   .findOne({email: req.body.email})
   .exec(function (err, user) {
   if (!err) {
   if (!user) {
   return next(new HttpError(401, 'User not found'));
   }
   else {
   var newUserRecoveryPassword = new UserRecoveryPassword({userID: user._id});
   newUserRecoveryPassword.save(function (err, data) {
   if (err) {
   return next(err);
   }
   else {
   res.render('email/user_recovery', data, function (err, html) {
   var options = {
   to: {
   email: user.email,
   name: user.name.firstName,
   surname: user.name.lastName,
   subject: "TripWeCan - password recovery"
   },
   html: html
   };
   var mailer = new Mailer(options, null);

   mailer.send(function (err, result) {
   if (err) {
   req.error('Error while sending email', err);
   res.status(503).end();
   }
   else {
   res.status(202).end();
   }
   });


   });
   }

   });

   }
   }
   else {
   next(new VError(err, 'Can not recover password'));
   }
   });
   },*/

  /*getRecoveryCode: function (req, res, next) {
   UserRecoveryPassword
   .findOne({code: req.params.code})
   .exec(function (err, urc) {
   if (!err) {
   if (urc) {
   res.render('user/recovery', urc);
   }
   else {
   res.render('user/mes', {'message': 'User not found'});
   }
   }
   else {
   next(err);
   }
   });
   },*/

  /*setRecoveryCode: function (req, res, next) { // TODO log method
   if (req.body.password != req.body.password2) {
   res.render('user/mes', {'message': 'Password changed!'});
   }
   UserRecoveryPassword
   .findOne({
   code: req.params.code,
   _id: req.body._id
   })
   .exec(function (err, urc) {
   if (!err) {
   if (urc) {
   User
   .findOne({_id: urc.userID})
   .exec(function (err, user) {
   if (!err) {
   user.password = req.body.password;
   user.save(function (err, data) {
   if (!err) {
   res.render('user/mes', {'message': 'Password changed!'});
   urc.remove();
   }
   else {
   res.render('user/mes', {'message': err.message.message});
   }
   })
   }
   else {
   next(err);
   }
   })
   }
   else {
   res.render('user/mes', {'message': 'User not found'});
   }
   }
   else {
   next(err);
   }
   });
   },*/

  /*companies: function (req, res, next) {
   var query = {'customerID': req.user._id};

   Company
   .find(underscore.extend(req.mngs.q, query), req.mngs.f, req.mngs.opt)
   .populate('stateID')
   .exec(function (err, data) {
   if (!err) {

   Company.populate(data, {
   path: 'stateID.countryID',
   model: 'Country'
   }, function (err, country) {
   if (!err) {
   res.json(country);
   }
   else {
   next(err);
   }
   });


   }
   else {
   next(err);
   }
   })
   }*/
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
  if (req.body.roleID == 1 /* || req.body.roleID == 2 */) { // new user is admin or client
    if (!req.user || req.user.role != 'admin') {
      throw  new HttpError(403, 'You don\'t have necessary rights to create this kind of user'); // Admin and client can be created only by admin
    }
  }

  var user = yield thunkQuery(User.insert(req.body).returning(User.id));

  var subject = "Thank you for registering at TripWeCan"
  var recipient = {'email': req.body.email, 'name': req.body.firstName + " " + req.body.lastName};

  var template = 'registration';
  var vars = [{
    "name": "name",
    "content": req.body.firstName + " " + req.body.lastName

  }];

  Mailer.send(subject, recipient, template, vars);

  return user;
}

