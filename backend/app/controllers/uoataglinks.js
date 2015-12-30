var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    UnitOfAnalysisTagLink = require('app/models/uoataglinks'),
    AccessMatrix = require('app/models/access_matrices'),
    Translation = require('app/models/translations'),
    Language = require('app/models/languages'),
    Essence = require('app/models/essences'),
    co = require('co'),
    Query = require('app/util').Query,
/*
    getTranslateQuery = require('app/util').getTranslateQuery,
    detectLanguage = require('app/util').detectLanguage,
*/
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysisTagLink.select(UnitOfAnalysisTagLink.count('counter')), _.omit(req.query, 'offset', 'limit', 'order'));
            var uoaTagLink = thunkQuery(UnitOfAnalysisTagLink.select(), req.query);
            return yield [_counter, uoaTagLink];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTagLink.insert(req.body).returning(UnitOfAnalysisTagLink.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* (){
            return yield thunkQuery(UnitOfAnalysisTagLink.update(req.body).where(UnitOfAnalysisTagLink.id.equals(req.body.id)));
        }).then(function(){
            res.status(202).end();
        },function(err){
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* (){
            return yield thunkQuery(UnitOfAnalysisTagLink.delete().where(UnitOfAnalysisTagLink.id.equals(req.params.id)));
        }).then(function(){
            res.status(204).end();
        },function(err){
            next(err);
        });
    },

    selectTags: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(Role_rights.select(Role_rights.count('counter')).where(req.params), _.omit(req.query, 'offset', 'limit', 'order'));
            var role_right = thunkQuery(Role_rights.select(Rights.star()).from(Role_rights.leftJoin(Rights).on(Role_rights.rightID.equals(Rights.id))).where(req.params), req.query)
                ;

            return yield [_counter, role_right];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    }

};
