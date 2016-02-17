var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    vl = require('validator'),
    UnitOfAnalysis = require('app/models/uoas'),
    AccessMatrix = require('app/models/access_matrices'),
    Translation = require('app/models/translations'),
    Language = require('app/models/languages'),
    Essence = require('app/models/essences'),
    co = require('co'),
    Query = require('app/util').Query,
    getTranslateQuery = require('app/util').getTranslateQuery,
    detectLanguage = require('app/util').detectLanguage,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    selectOrigLanguage: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysis.select(UnitOfAnalysis.count('counter')));
            var uoa = thunkQuery(UnitOfAnalysis.select(), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoa];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysis.select(UnitOfAnalysis.count('counter')));
            var langId = yield * detectLanguage(req);
            var uoa = thunkQuery(getTranslateQuery(langId, UnitOfAnalysis), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield [_counter, uoa];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysis, UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            req.body.creatorId = req.user.id;
            req.body.ownerId = req.user.id;
            req.body.createTime = new Date();
            return yield thunkQuery(UnitOfAnalysis.insert(req.body).returning(UnitOfAnalysis.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            delete req.body.createTime;
            return yield thunkQuery(UnitOfAnalysis.update(req.body).where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(UnitOfAnalysis.delete().where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    csvImport: function (req, res, next) {

/*
        Field	            Type            	            Comment
        Id	                int NOT NULL AUTO_INCREMENT
        gadmId0 	        int DEFAULT NULL	            for use with GADM shapefile
        gadmId1 	        int DEFAULT NULL	            for use with GADM shapefile
        gadmId2 	        int DEFAULT NULL	            for use with GADM shapefile
        gadmId3 	        int DEFAULT NULL	            for use with GADM shapefile
        gadmObjectId	    int DEFAULT NULL	            for use with GADM shapefile (only Global Shapefile)
        ISO	                char(3)                         only for Country level UoA
        ISO2	            char(2)                     	only for Country level UoA
        nameISO 	        varchar(100)                 	only for Country level UoA
        name	            varchar(100) NOT NULL	        Multilanguage
        description	        varchar(255) DEFAULT NULL	    Multilanguage
        shortName	        varchar(45) NOT NULL	        Multilanguage
        HASC	            varchar(20) DEFAULT NULL	    (example RU.AD.OK)
        unitOfAnalysisType	tinyint(4) NOT NULL	            see table UoA_type
        Parent_Id	        int DEFAULT NULL	            Link to Parent UoA if exist
                            Service fields		Below, service fields from old system - It can be changed and added later
        ---                creatorId   	    NOT NULL DEFAULT '1'
        ---                ownerId     	    NOT NULL DEFAULT '1'
        visibility	        tinyint(4) NOT NULL DEFAULT '1'	1 = public; 2 = private;
        status	            tinyint(4) NOT NULL DEFAULT '1' 1 = active; 2 = inactive; 3 = deleted;
        ---                created	        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        ---                updated	        timestamp NULL DEFAULT NULL
        ---                deleted	        timestamp NULL DEFAULT NULL
        langId              original language Id            default EN
*/

        var csv = require('csv');
        var fs = require('fs');

        var upload = function*(){
            return yield new Promise(function(resolve, reject) {
                if(req.files.file) {
                    fs.readFile(req.files.file.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data);
                    });
                }else{
                    reject( new HttpError(403,'Please, pass csv file in files[\'file\']'));
                }
            });
        };

        var parser = function* (data) {
            return yield new Promise(function(resolve, reject){
                csv.parse(data, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file'));
                    }
                    resolve(data);
                });
            });
        };

        co(function* () {
            var result = [];
            try {
                var doUpload = yield* upload();
                var parsed = yield* parser(doUpload);

                var intOrNull = function (val){
                    return (isNaN(parseInt(val))) ? null : parseInt(val);
                };

                for (var i in parsed) {
                    if (i != 0) { // skip first string
                        var newUoa = {
                            parse_status   : 'skipped',
                            gadmId0        : intOrNull(parsed[i][0]),
                            gadmId1        : intOrNull(parsed[i][1]),
                            gadmId2        : intOrNull(parsed[i][2]),
                            gadmId3        : intOrNull(parsed[i][3]),
                            gadmObjectId   : intOrNull(parsed[i][4]),
                            ISO            : parsed[i][5],
                            ISO2           : parsed[i][6],
                            nameISO        : parsed[i][7],
                            name           : parsed[i][8],
                            description    : parsed[i][9],
                            shortName      : parsed[i][10],
                            HASC           : parsed[i][11],
                            unitOfAnalysisType : parsed[i][12], // default `Country` (id=1)
                            Parent_Id	   : intOrNull(parsed[i][13]),
                            visibility	   : parsed[i][14], // 1 = public (default); 2 = private;
                            status	       : parsed[i][15], // 1 = active (default); 2 = inactive; 3 = deleted;
                            langId         : intOrNull(parsed[i][16]), // default EN
                            creatorId      : req.user.id,
                            ownerId        : req.user.id
                        };

                        if (vl.isNull(newUoa.name)) {
                            newUoa.message = '`Name` must not be empty';
                        }else{
                            var isExist = yield thunkQuery(UnitOfAnalysis.select().where(UnitOfAnalysis.name.equals(newUoa.name)));
                            if (isExist[0]) {
                                newUoa.message = 'Already exists';
                            }else{
                                // validate and set default
                                // unitOfAnalysisType
                                // visibility
                                // status
                                // langId
                                // then created
                                var created = yield thunkQuery(UnitOfAnalysis.insert(_.pick(newUoa, UnitOfAnalysis.whereCol)).returning(UnitOfAnalysis.id));
                                if (created[0]) {
                                    newUoa.id = created[0].id;
                                    newUoa.parse_status = 'Ok';
                                    newUoa.message = 'Added';
                                }

                            }
                        }

                        result.push(newUoa);
                    }
                }
                return result;

            } catch(e) {
                throw e;
            }

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        })
    }

};
