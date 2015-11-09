var client = require('app/db_bootstrap'),
  _ = require('underscore'),
  config = require('config'),
// tables
  Role = require('app/models/role');

var co = require('co');
//var query = thunkify(client.query);
var Query = require('app/util').Query,
  query = new Query();

module.exports = {

  select: function (req, res, next) {
    var q = Role.select().from(Role);
    //console.log('query',query)
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.json(data);
    });

    /*co(function *(){
     var roles = yield query(Role.select().from(Role).toQuery());
     var roles_count = yield query(Role.select().from(Role).toQuery());
     return [roles, roles_count];
     })(function(err, result) {
     console.log(arguments)
     });*/

  },
  selectOne: function (req, res, next) {
    query(Role.select().where(req.params), function (err, role) {
      if (!err) {
        res.json(_.first(role));
      } else {
        next(err);
      }
    });
  },
  insertOne: function (req, res, next) {
    query(Role.insert(req.body).returning(Role.id),
      function (err, data) {
        if (!err) {
          res.status(201).json(_.first(data));
        }
        else {
          next(err);
        }
      });
  },
  updateOne: function (req, res, next) {
    query(
      Role.update(req.body).where(Role.id.equals(req.params.id)),
      function (err, data) {
        if (!err) {
          res.status(202).end();
        } else {
          next(err);
        }
      }
    );
  },



  /*updateOne: function (req, res, next) {

   },*/

  /*deleteOne: function (req, res, next) {

   }*/

};
