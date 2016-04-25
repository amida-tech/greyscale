var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    UnitOfAnalysisTagLink = require('app/models/uoataglinks'),
    UnitOfAnalysisTag = require('app/models/uoatags'),
    UnitOfAnalysisClassType = require('app/models/uoaclasstypes'),
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var selectQueryCounter = UnitOfAnalysisTagLink.select(UnitOfAnalysisTagLink.count('counter'));
            var selectQuery = UnitOfAnalysisTagLink.select();
            if (req.query) {
                if (req.query.id) {
                    selectQueryCounter = selectQueryCounter.where(UnitOfAnalysisTagLink.id.equals(req.query.id));
                    selectQuery = selectQuery.where(UnitOfAnalysisTagLink.id.equals(req.query.id));
                }
                if (req.query.uoaId) {
                    selectQueryCounter = selectQueryCounter.where(UnitOfAnalysisTagLink.uoaId.equals(req.query.uoaId));
                    selectQuery = selectQuery.where(UnitOfAnalysisTagLink.uoaId.equals(req.query.uoaId));
                }
                if (req.query.tagId) {
                    selectQueryCounter = selectQueryCounter.where(UnitOfAnalysisTagLink.tagId.equals(req.query.tagId));
                    selectQuery = selectQuery.where(UnitOfAnalysisTagLink.tagId.equals(req.query.tagId));
                }
            }
            var _counter = thunkQuery(selectQueryCounter);
            var uoaTagLink = thunkQuery(selectQuery);
            return yield [_counter, uoaTagLink];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    checkInsert: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            var dataClassTypeId = yield thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.classTypeId)
                .where(UnitOfAnalysisTag.id.equals(req.body.uoaTagId)));
            var classTypeId = dataClassTypeId[0] ? dataClassTypeId[0].classTypeId : null;
            if (!classTypeId) {
                next(new HttpError(401, 'Not found tag with specified Id `' + req.body.uoaTagId + '`'));
            } else {
                var queryClassTypeName = UnitOfAnalysisClassType
                    .select(UnitOfAnalysisClassType.name)
                    .where(UnitOfAnalysisClassType.id.equals(classTypeId));
                var classTypeName = thunkQuery(queryClassTypeName);

                var query = UnitOfAnalysisTagLink.select(UnitOfAnalysisTag.classTypeId)
                    .from(UnitOfAnalysisTagLink.leftJoin(UnitOfAnalysisTag).on(UnitOfAnalysisTagLink.uoaTagId.equals(UnitOfAnalysisTag.id)))
                    .where(UnitOfAnalysisTagLink.uoaId.equals(req.body.uoaId))
                    .where(UnitOfAnalysisTag.classTypeId.equals(classTypeId));
                var uoaTagLink = thunkQuery(query);

                return yield [classTypeId, classTypeName, uoaTagLink];
            }
        }).then(function (data) {
            if ((data[2]).length > 0) {
                next(new HttpError(401, 'Could not add tag with the same classification type: `' + data[1][0].name + '`'));
            }
            next();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTagLink.insert(req.body).returning(UnitOfAnalysisTagLink.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UnitOfAnalysisTagLink',
                entity: _.first(data).id,
                info: 'Add new uoa tag link'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTagLink.delete().where(UnitOfAnalysisTagLink.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UnitOfAnalysisTagLink',
                entity: req.params.id,
                info: 'Delete uoa tag link'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    }

};
