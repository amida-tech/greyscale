var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    Workflow = require('app/models/workflows'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* (){
            return yield thunkQuery(Workflow.select().from(Workflow), _.omit(req.query, 'offset', 'limit', 'order'));
        }).then(function(data) {
            res.json(data);
        }, function(err) {
            next(err);
        });

    },

    selectOne: function(req, res, next){
        query(Workflow.select().where(Workflow.id.equals(req.params.id)), function (err, data) {
            if (err) {
                return next(err);
            }
            if(!_.first(data)){
                return next(new HttpError(404, 'Not found'));
            }
            res.status(200).json(_.first(data));
        });
    },

    updateOne: function(req, res, next){
        // TODO validation
        co(function* () {
            var result = yield thunkQuery(Workflow.update(req.body).where(Workflow.id.equals(req.params.id)));
            return result;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function(req, res, next){
        query(Workflow.delete().where(Workflow.id.equals(req.params.id)), function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    insertOne: function (req, res, next) {
        // TODO validation
        co(function* () {

            var result = yield thunkQuery(Workflow.insert(req.body).returning(Workflow.id));
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });


    }

};
