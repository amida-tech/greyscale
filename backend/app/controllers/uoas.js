var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    vl = require('validator'),
    UnitOfAnalysis = require('app/models/uoas'),
    UnitOfAnalysisType = require('app/models/uoatypes'),
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
    sql = require('sql'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_uoas');
debug.log = console.log.bind(console);

module.exports = {

    selectOrigLanguage: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
        var thunkQuery = req.thunkQuery;
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(getTranslateQuery(req.query.langId, UnitOfAnalysis, UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function (data) {
            res.json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            req.body.creatorId = req.user.realmUserId; // add from realmUserId instead of user id
            req.body.ownerId = req.user.realmUserId; // add from realmUserId instead of user id
            req.body.created = new Date();
            return yield thunkQuery(UnitOfAnalysis.insert(req.body).returning(UnitOfAnalysis.id));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UnitOfAnalysis',
                entity: _.first(data).id,
                info: 'Add new uoa'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            delete req.body.created;
            req.body.updated = new Date();
            return yield thunkQuery(UnitOfAnalysis.update(req.body).where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'UnitOfAnalysis',
                entity: req.params.id,
                info: 'Update uoa'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(UnitOfAnalysis.delete().where(UnitOfAnalysis.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UnitOfAnalysis',
                entity: req.params.id,
                info: 'Delete uoa'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    csvImport: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
                        resolve(data.replace(new RegExp('[\'\"]','g'), '`'));
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
            var ret;
            try {
                var doUpload = yield* upload();
                var parsed = yield* parser(doUpload);

                var intOrNull = function (val){
                    return isNaN(parseInt(val)) ? null : parseInt(val);
                };
                if (parsed.length < 1) {
                    return result;
                }
            } catch(e) {
                throw new HttpError(500, e);
            }
            for (var i=0;i<parsed.length;i++) {
                if (i !== 0) { // skip first string
                    var newUoa = {
                        parse_status   : 'skipped',
                        name           : parsed[i][0],
                        description    : parsed[i][1],
                        shortName      : parsed[i][2],
                        ISO            : parsed[i][3],
                        ISO2           : parsed[i][4],
                        nameISO        : parsed[i][5],
                        unitOfAnalysisType : intOrNull(parsed[i][6]), // default `Country`
                        visibility	   : intOrNull(parsed[i][7]), // 1 = public (default); 2 = private;
                        status	       : intOrNull(parsed[i][8]), // 1 = active (default); 2 = inactive; 3 = deleted;
                        langId         : intOrNull(parsed[i][9]), // default EN
                        parentId	   : intOrNull(parsed[i][10]),
                        gadmId0        : intOrNull(parsed[i][11]),
                        gadmId1        : intOrNull(parsed[i][12]),
                        gadmId2        : intOrNull(parsed[i][13]),
                        gadmId3        : intOrNull(parsed[i][14]),
                        gadmObjectId   : intOrNull(parsed[i][15]),
                        HASC           : parsed[i][16],
                        creatorId      : req.user.realmUserId, // add from realmUserId instead of user id
                        ownerId        : req.user.realmUserId  // add from realmUserId instead of user id
                    };

                    newUoa.messages = [];
                    debug(newUoa);
                    var valid = true;
                    if (vl.isNull(newUoa.name)) {
                        newUoa.messages.push('`Name` must not be empty');
                    }else{
                        var isExist = yield thunkQuery(UnitOfAnalysis.select().where(UnitOfAnalysis.name.equals(newUoa.name)));
                        if (isExist[0]) {
                            newUoa.messages.push('Already exists');
                            valid = false;
                        }else{
                            // Validate and Set DEFAULT
                            // unitOfAnalysisType
                            if (!newUoa.unitOfAnalysisType) {
                                // default `Country`
                                ret = yield thunkQuery(UnitOfAnalysisType.select().where(sql.functions.UPPER(UnitOfAnalysisType.name).equals('COUNTRY')));
                                if (ret[0]) {
                                    newUoa.unitOfAnalysisType = ret[0].id;
                                } else {
                                    newUoa.messages.push('Target Type `Country` (default) does not exist in database');
                                    valid = false;
                                }
                            } else {
                                // check that specified type Unit of Analysis is exist
                                ret = yield thunkQuery(UnitOfAnalysisType.select().where(UnitOfAnalysisType.id.equals(newUoa.unitOfAnalysisType)));
                                if (!ret[0]) {
                                    newUoa.messages.push('Target Type with Id `'+newUoa.unitOfAnalysisType.toString()+'` does not exist in database');
                                    valid = false;
                                }
                            }
                            // visibility
                            if (!newUoa.visibility) {
                                // 1 = public (default); 2 = private;
                                newUoa.visibility = 1;
                            } else {
                                // check that specified visibility value is correct
                                if ([1,2].indexOf(newUoa.visibility) === -1) {
                                    newUoa.messages.push('Target Visibility `'+newUoa.visibility.toString()+'` does not correct (1 = public (default); 2 = private)');
                                    valid = false;
                                }
                            }
                            // status
                            if (!newUoa.status) {
                                // 1 = active (default); 2 = inactive; 3 = deleted;
                                newUoa.status = 1;
                            } else {
                                // check that specified status value is correct
                                if ([1,2,3].indexOf(newUoa.status) === -1) {
                                    newUoa.messages.push('Target Status `'+newUoa.status.toString()+'` does not correct (1 = active (default); 2 = inactive; 3 = deleted)');
                                    valid = false;
                                }
                            }
                            // langId
                            if (!newUoa.langId) {
                                // default EN
                                ret = yield thunkQuery(Language.select().where(Language.code.equals('en')));
                                if (ret[0]) {
                                    newUoa.langId = ret[0].id;
                                } else {
                                    newUoa.messages.push('Language `en` (default) does not exist in database');
                                    valid = false;
                                }
                            } else {
                                // check that specified Language Id is exist
                                ret = yield thunkQuery(Language.select().where(Language.id.equals(newUoa.langId)));
                                if (!ret[0]) {
                                    newUoa.messages.push('Language with Id `'+newUoa.langId.toString()+'` does not exist in database');
                                    valid = false;
                                }
                            }
                            // shortName
                            if (vl.isNull(newUoa.shortName)) {
                                newUoa.messages.push('`shortName` must not be empty');
                                valid = false;
                            }
                            // ISO
                            if (newUoa.ISO !== '' && (!vl.isAlpha(newUoa.ISO) || !vl.isLength(newUoa.ISO, {min:3, max:3}))) {
                                newUoa.messages.push('`ISO` must not be 3 alpha symbols');
                                valid = false;
                            }
                            // ISO2
                            if (newUoa.ISO2 !== '' && (!vl.isAlpha(newUoa.ISO2) || !vl.isLength(newUoa.ISO2, {min:2, max:2}))) {
                                newUoa.messages.push('`ISO2` must not be 2 alpha symbols');
                                valid = false;
                            }
                            // If valid, then created
                            if (valid) {
                                try{
                                    var created = yield thunkQuery(UnitOfAnalysis.insert(_.pick(newUoa, UnitOfAnalysis.whereCol)).returning(UnitOfAnalysis.id));
                                }catch(e){
                                    newUoa.messages.push(e);
                                    valid = false;
                                }
                            }

                            if (valid && created[0]) {
                                newUoa.id = created[0].id;
                                newUoa.parse_status = 'Ok';
                                newUoa.messages.push('Added');
                                bologger.log({
                                    req: req,
                                    user: req.user,
                                    action: 'insert',
                                    object: (!bologger.data.essence) ? 'UnitOfAnalysis' : null,
                                    entity: created[0].id,
                                    info: 'Add new uoa (bulk import)'
                                });
                            }
                        }
                    }
                    result.push(newUoa);
                }
            }
            return result;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }

};
