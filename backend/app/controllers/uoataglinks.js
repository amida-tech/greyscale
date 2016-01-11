var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
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
        co(function* () {

            var data_classTypeId = yield thunkQuery(UnitOfAnalysisTag.select(UnitOfAnalysisTag.classTypeId)
                .where(UnitOfAnalysisTag.id.equals(req.body.uoaTagId)));
            var classTypeId = data_classTypeId[0] ? data_classTypeId[0].classTypeId : null;
            var query_classTypeName = UnitOfAnalysisClassType.select(UnitOfAnalysisClassType.name);
            if (data_classTypeId[0]) {
                query_classTypeName = query_classTypeName.where(UnitOfAnalysisClassType.id.equals(data_classTypeId[0].classTypeId));
            }
            var classTypeName = thunkQuery(query_classTypeName);

            var query = UnitOfAnalysisTagLink.select(UnitOfAnalysisTag.classTypeId)
                .from(UnitOfAnalysisTagLink.leftJoin(UnitOfAnalysisTag).on(UnitOfAnalysisTagLink.uoaTagId.equals(UnitOfAnalysisTag.id)));
            query.where(UnitOfAnalysisTagLink.uoaId.equals(req.body.uoaId));
            query.where(UnitOfAnalysisTag.classTypeId.equals(data_classTypeId[0].classTypeId));

            var uoaTagLink = thunkQuery(query);
            return yield [classTypeId, classTypeName, uoaTagLink];
        }).then(function (data) {
            if ((data[2]).length > 0) {
                next( new HttpError(401, 'Could not add tag with the same classification type: `'+data[1][0].name+'`'));
            }
            next();
        }, function (err) {
            next(err);
        });
    },

/*
    var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
if (!_.first(isExistMatrix)) {
    throw new HttpError(403, 'Matrix with this id does not exist');
}

var result = yield thunkQuery(Product.insert(req.body).returning(Product.id));

return result;
}).then(function (data) {
    res.status(201).json(_.first(data));
}, function (err) {
    next(err);
});
*/


insertOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysisTagLink.insert(req.body).returning(UnitOfAnalysisTagLink.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
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
    }


};
