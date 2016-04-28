var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    // tables
    Role = require('app/models/roles');

var co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(Role.select().from(Role), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },
    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            var data = yield thunkQuery(
                Role.select().where(_.pick(req.params, ['id']))
            );
            if(!data.length){
                throw new HttpError(404, 'Not found');
            }
            return data;
        }).then(function(role){
            res.json(_.first(role));
        }, function(err){
            next(err);
        });

    },
    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                Role.insert(req.body).returning(Role.id)
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'roles',
                entity: _.first(data).id,
                info: 'Add new role'
            });
            res.status(201).json(_.first(data));
        }, function(err){

        });

    },
    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                Role.update(req.body).where(Role.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'roles',
                entity: req.params.id,
                info: 'Update role'
            });
            res.status(202).end();
        }, function(err){
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            yield thunkQuery(
                Role.delete().where(Role.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'roles',
                entity: req.params.id,
                info: 'Delete role'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });

    }
};
