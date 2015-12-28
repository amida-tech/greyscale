var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  crypto = require('crypto'),
  config = require('config'),
  User = require('app/models/users'),
  Organization = require('app/models/organizations'),
  Rights = require('app/models/rights'),
  RoleRights = require('app/models/role_rights'),
  Token = require('app/models/token'),
  VError = require('verror'),
  logger = require('app/logger'),
  vl = require('validator'),
  HttpError = require('app/error').HttpError,
  util = require('util'),
  async = require('async'),
  Emailer = require('lib/mailer');

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

  checkToken: function(req, res, next) {
    co(function* (){
      var existToken = yield thunkQuery(Token.select().where(Token.body.equals(req.params.token)));
      if(!_.first(existToken)){
        throw new HttpError(400, 'Token invalid');
      }
      return existToken;
    }).then(function(data){
      res.status(200).end();
    }, function(err) {
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

  invite: function (req, res, next) {
    co(function* (){
      if(!req.body.email || !req.body.firstName || !req.body.lastName){
        throw new HttpError(400, 'Email, First name and Last name fields are required');
      }
      if (!vl.isEmail(req.body.email)) {
        throw new HttpError(400, 101);
      }
      var isExistUser = yield thunkQuery(User.select(User.star()).where(User.email.equals(req.body.email)));
      isExistUser = _.first(isExistUser);
      if(isExistUser && isExistUser.isActive){
        throw new HttpError(400, 'User with this email has already registered');
      }

      var OrgNameTemp     = 'Your new organization';
      var firstName       = isExistUser ? isExistUser.firstName : req.body.firstName;
      var lastName        = isExistUser ? isExistUser.lastName : req.body.lastName;
      var activationToken = isExistUser ? isExistUser.activationToken : crypto.randomBytes(32).toString('hex');
      var pass            = crypto.randomBytes(5).toString('hex');

      if(!isExistUser){
        
        var newClient = {
          'firstName'       : req.body.firstName,
          'lastName'        : req.body.lastName,
          'email'           : req.body.email,
          'roleID'          : 2, //client
          'password'        : User.hashPassword(pass),
          'isActive'        : false,
          'activationToken' : activationToken
        };

        var userId = yield thunkQuery(User.insert(newClient).returning(User.id));

        var newOrganization = {
          'name'        : OrgNameTemp,
          'adminUserId' : _.first(userId).id,
          'isActive'    : false
        };

        var organizationId = yield thunkQuery(Organization.insert(newOrganization).returning(Organization.id));

        console.log(_.first(organizationId).id);

        yield thunkQuery(User.update({organizationId: _.first(organizationId).id}).where({id: _.first(userId).id}));
      }

      var userId = isExistUser ? isExistUser.id : _.first(userId).id;



      var options = {
        to : {
          name    : firstName,
          surname : lastName,
          email   : req.body.email,
          subject : 'Indaba. Invite'
        },
        template: 'invite'
      };
      var data = {
        name: firstName,
        surname: lastName,
        company_name: OrgNameTemp,
        login: req.body.email,
        password: pass,
        token: activationToken
      };
      var mailer = new Emailer(options, data);
      mailer.send();
      
    }).then(function(data){
      res.status(200).end();
    }, function(err){
      next(err);
    });
  },

  checkActivationToken: function(req, res, next) {
    co(function* (){
      var isExist = yield thunkQuery(User.select(User.star()).from(User).where(User.activationToken.equals(req.params.token)));
      if(!_.first(isExist)){
        throw new HttpError(400, 'Token is not valid')
      }
      return isExist;
    }).then(function(data){
      res.json(_.first(data));
    },function(err){
      next(err);
    });
  },

  activate: function(req, res, next){
    co(function* (){
      var isExist = yield thunkQuery(User.select(User.star()).from(User).where(User.activationToken.equals(req.params.token)));
      if(!_.first(isExist)){
        throw new HttpError(400, 'Token is not valid');
      }
      if(!req.body.password){
        throw new HttpError(400, 'Password field is required!');
      }
      var data = {
        activationToken : null,
        isActive        : true,
        password        : User.hashPassword(req.body.password),
        firstName       : req.body.firstName,
        lastName        : req.body.lastName
      }
      var updated = yield thunkQuery(User.update(data).where(User.activationToken.equals(req.params.token)).returning(User.id));
      return updated;
    }).then(function(data){
      res.json(_.first(data));
    },function(err){
      next(err);
    });
  },

  selfOrganization: function(req, res, next){
    co(function* (){
      if(req.user.roleID !== 2){
        throw new HttpError(400, 'Your role is not "client". Only clients can have organization');
      }
      Org = yield thunkQuery(Organization.select(Organization.star()).from(Organization).where(Organization.adminUserId.equals(req.user.id)));
      if(!_.first(Org)){
        throw new HttpError(404, 'Not found');
      }
      return _.first(Org);
    }).then(function(data) {
      res.json(data);
    },function(err) {
      next(err);
    });
  },

  selfOrganizationUpdate: function(req, res, next){
    co(function* (){
      if(!req.body.name || !req.body.address || !req.body.url){
        throw new HttpError(400, 'Name, address and url fields are required');
      }
      var data = {
        name     : req.body.name,
        address  : req.body.address,
        url      : req.body.url,
        isActive : true
      }
      var updated = yield thunkQuery(Organization.update(data).where(Organization.adminUserId.equals(req.user.id)).returning(Organization.id));
      if(!_.first(updated)){
        throw new HttpError(404, 'Not found');
      }
      return updated;
    }).then(function(data){
      res.json(_.first(data));
    }, function(err){
      next(err);
    });
  },

  selfOrganizationInvite: function(req, res, next){
    co(function* (){
      if(!req.body.email || !req.body.firstName || !req.body.lastName){
        throw new HttpError(400, 'Email, First name and Last name fields are required');
      }
      if (!vl.isEmail(req.body.email)) {
        throw new HttpError(400, 101);
      }
      var isExistUser = yield thunkQuery(User.select(User.star()).where(User.email.equals(req.body.email)));
      isExistUser = _.first(isExistUser);
      if(isExistUser && isExistUser.isActive){
        throw new HttpError(400, 'User with this email has already registered');
      }

      var org = yield thunkQuery(Organization.select().where(Organization.adminUserId.equals(req.user.id)));
      org = _.first(org);
      if(!org){
        throw new HttpError(400, 'You dont have any organizations');
      }

      var firstName       = isExistUser ? isExistUser.firstName : req.body.firstName;
      var lastName        = isExistUser ? isExistUser.lastName : req.body.lastName;
      var activationToken = isExistUser ? isExistUser.activationToken : crypto.randomBytes(32).toString('hex');
      var pass            = crypto.randomBytes(5).toString('hex');

      if(!isExistUser){
        var newClient = {
          'firstName'       : req.body.firstName,
          'lastName'        : req.body.lastName,
          'email'           : req.body.email,
          'roleID'          : 3, //user
          'password'        : User.hashPassword(pass),
          'isActive'        : false,
          'activationToken' : activationToken,
          'organizationId'  : org.id
        };

        var userId = yield thunkQuery(User.insert(newClient).returning(User.id));
      }


      var options = {
        to : {
          name    : firstName,
          surname : lastName,
          email   : req.body.email,
          subject : 'Indaba. Organization membership'
        },
        template: 'org_invite'
      };
      var data = {
        name: firstName,
        surname: lastName,
        company: org,
        inviter : req.user,
        // login: req.body.email,
        // password: pass,
        token: activationToken
      };
      var mailer = new Emailer(options, data);
      mailer.send(function(data){
        console.log("EMAIL RESULT --->>>");
        console.log(data);

      });
      

      return newClient;
    }).then(function(data){
      res.json(data);
    }, function(err){
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

          var options = {
            to : {
              name: user.firstName,
              surname : user.lastName,
              email : req.body.email,
              subject : 'Indaba. Restore password'
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

  var options = {
    to : {
      name: req.body.firstName,
      surname : req.body.lastName,
      email : req.body.email,
      subject : 'Thank you for registering at Indaba'
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

