var _ = require('underscore'),
    config = require('../../config'),
    common = require('../services/common'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    vl = require('validator'),
    UnitOfAnalysis = require('../models/uoas'),
    UnitOfAnalysisType = require('../models/uoatypes'),
    UnitOfAnalysisTagLink = require('../models/uoataglinks'),
    Language = require('../models/languages'),
    ProductUOA = require('../models/product_uoa'),
    Product = require('../models/products'),
    Project = require('../models/projects'),
    co = require('co'),
    Query = require('../util').Query,
    getTranslateQuery = require('../util').getTranslateQuery,
    detectLanguage = require('../util').detectLanguage,
    query = new Query(),
    thunkify = require('thunkify'),
    sql = require('sql'),
    HttpError = require('../error').HttpError,
    common = require('../services/common'),
    thunkQuery = thunkify(query);

var debug = require('debug')('debug_uoas');
debug.log = console.log.bind(console);

const DELETE_OPTIONS = {
    'entireSystem': 1,
    'projectOnly': 2
};

module.exports = {

    selectOrigLanguage: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(UnitOfAnalysis.select(UnitOfAnalysis.count('counter')));
            var uoa = thunkQuery(UnitOfAnalysis.select().where(UnitOfAnalysis.isDeleted.isNull()), _.omit(req.query, 'offset', 'limit', 'order'));
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
            var uoa = thunkQuery(getTranslateQuery(langId, UnitOfAnalysis, UnitOfAnalysis.isDeleted.isNull()), _.omit(req.query, 'offset', 'limit', 'order'));
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
            var langId = yield * detectLanguage(req);
            return yield thunkQuery(getTranslateQuery(langId, UnitOfAnalysis, UnitOfAnalysis.id.equals(req.params.id).and(UnitOfAnalysis.isDeleted.isNull())));
        }).then(function (data) {
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                res.json({
                    'message': 'No UOA Found',
                    'Data': data
                });
            }
        }, function (err) {
            next(err);
        });
    },

    insert: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var uoas;
        var sqlString;

        // Verify that the body contains the subjects
        if (req.body.subjects) {
            //convert the input to an array because we want to be able to pass in just one subject
            if (!Array.isArray(req.body.subjects)) {
                req.body.subjects = [{name: req.body.subjects}];
            }

            // Check that no blank subject name was passed in
            for (let i = 0; i < req.body.subjects.length; i++) {
                if (req.body.subjects[i].name == '') {
                    throw new HttpError(400, 'Subject Cannot be empty');
                }
            }

            uoas = req.body.subjects.map((subject) => subject.name);
            sqlString = "'" + uoas.toString().replace(/'/g, "''").replace(/,/g, "','") + "'";
        } else {
            throw new HttpError(400, 'Missing Subjects');
        }

        co(function* () {
            // Check if Subjects already exist in DB
            const existingRecords = yield thunkQuery(
                'SELECT * FROM "UnitOfAnalysis" ' +
                'WHERE LOWER("UnitOfAnalysis"."name") IN (' + sqlString.toLowerCase() + ') ' +
                'AND "UnitOfAnalysis"."unitOfAnalysisType" = ' + req.body.unitOfAnalysisType
            );

            // Empty list to hold inserted or modified records
            const insertedRecords = [];

            if (_.first(existingRecords)) {
                for (let i = 0; i < existingRecords.length; i++) {
                    if (existingRecords[i].isDeleted !== null) {
                        const updateObj = {
                            isDeleted: null
                        };

                        yield thunkQuery(
                            UnitOfAnalysis.update(updateObj).where(UnitOfAnalysis.id.equals(existingRecords[i].id))
                        );
                    }

                    if (req.body.productId) {
                        // check that record doesn't already exist in productUOA
                        const recordInProductUOA = yield thunkQuery(
                            ProductUOA.select().where(ProductUOA.UOAid.equals(existingRecords[i].id)
                                                .and(ProductUOA.productId.equals(req.body.productId)))
                        );

                        if (!_.first(recordInProductUOA)) { // Record not in productUOA, we can add it

                            yield thunkQuery(ProductUOA.insert({
                                productId: req.body.productId,
                                UOAid: existingRecords[i].id,
                                currentStepId: null,
                                isComplete: false,
                            }));
                        } else if (_.first(recordInProductUOA).isDeleted !== null) {
                            const updateObj = {
                                isDeleted: null
                            };

                            yield thunkQuery(
                                ProductUOA.update(updateObj).where(ProductUOA.UOAid.equals(existingRecords[i].id))
                            );

                        } else {
                            throw new HttpError(403, 'Error adding duplicate subject to project');
                        }
                    }
                    insertedRecords.push({
                        id: existingRecords[i].id,
                        name: existingRecords[i].name
                    });
                }
            }

            if (uoas.length !== existingRecords.length) {
                //get the new records to be inserted into a new list
                const newRecords = _.difference(uoas, existingRecords.map((exist) => exist.name));

                for (let i = 0; i < newRecords.length; i++) {
                    // Insert the new records
                    const insertedRecord = yield thunkQuery(
                        UnitOfAnalysis.insert({
                            name: newRecords[i],
                            creatorId: req.user.realmUserId,
                            ownerId: req.user.realmUserId,
                            unitOfAnalysisType: req.body.unitOfAnalysisType,
                            created: new Date(),
                        }).returning(UnitOfAnalysis.id, UnitOfAnalysis.name)
                    );

                    // Insert into the productUOA table if applicable
                    if (req.body.productId) {
                        yield thunkQuery(ProductUOA.insert({
                            productId: req.body.productId,
                            UOAid: _.first(insertedRecord).id,
                            currentStepId: null,
                            isComplete: false,
                        }));
                    }
                    insertedRecords.push({
                        id: _.first(insertedRecord).id,
                        name: _.first(insertedRecord).name
                    });
                }

                yield common.bumpProjectLastUpdatedByProduct(req, req.body.productId);
            }
            return insertedRecords;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'UnitOfAnalysis',
                entity: data,
                info: 'Add new uoa'
            });
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            delete req.body.created;
            req.body.updated = new Date();
            return yield thunkQuery(UnitOfAnalysis.update(req.body).where(UnitOfAnalysis.id.equals(req.params.id).and(UnitOfAnalysis.isDeleted.isNull())));
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
            var result = yield thunkQuery(UnitOfAnalysisTagLink.select().where(UnitOfAnalysisTagLink.uoaId.equals(req.params.id)));
            if (_.first(result)) {
                throw new HttpError(403, 'Subject used in Subject to Tag link. Could not delete Subject');
            }

            //Check if the UOA passed in has a productId associated with it.
            const productUOA = yield thunkQuery(
                ProductUOA.select().from(ProductUOA).where(ProductUOA.UOAid.equals(req.params.id))
            );

            if (!_.first(productUOA)) {
                // Soft delete from the UOA table
                yield thunkQuery(
                    'UPDATE "UnitOfAnalysis"' +
                    'SET "isDeleted" = (to_timestamp(' + Date.now() +
                    '/ 1000.0)) WHERE "id" = ' + req.params.id
                );
            } else {
                if (req.body.productId) {
                    const productId = [{productId: req.body.productId}];
                    yield * uoaSoftDeleteHelper(req, productId, DELETE_OPTIONS.projectOnly);
                } else {
                    // Delete all UOA's from all products
                    yield * uoaSoftDeleteHelper(req, productUOA, DELETE_OPTIONS.entireSystem);
                }
            }
            return true;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'UnitOfAnalysis',
                entity: req.params.id,
                info: 'Delete uoa'
            });
            res.status(202).json(data);
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

        var upload = function* () {
            return yield new Promise(function (resolve, reject) {
                if (req.files.file) {
                    fs.readFile(req.files.file.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data.replace(new RegExp('[\'\"]', 'g'), '`'));
                    });
                } else {
                    reject(new HttpError(403, 'Please, pass csv file in files[\'file\']'));
                }
            });
        };

        var parser = function* (data) { // ToDo: move to service
            return yield new Promise(function (resolve, reject) {
                csv.parse(data, {relax_column_count: true}, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file: ' + err.message));
                    }
                    resolve(data);
                });
            });
        };

        co(function* () {
            var result = [];
            var ret, parsed, doUpload;
            var intOrNull = function (val) {
                return isNaN(parseInt(val)) ? null : parseInt(val);
            };
            try {
                doUpload = yield * upload();
                parsed = yield * parser(doUpload);
                if (parsed.length < 1) {
                    return result;
                }
            } catch (e) {
                throw e;
            }
            for (var i = 0; i < parsed.length; i++) {
                if (i !== 0) { // skip first string
                    var newUoa = {
                        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                        parse_status: 'skipped',
                        name: parsed[i][0],
                        description: parsed[i][1],
                        shortName: parsed[i][2],
                        ISO: parsed[i][3],
                        ISO2: parsed[i][4],
                        nameISO: parsed[i][5],
                        unitOfAnalysisType: intOrNull(parsed[i][6]), // default `Country`
                        visibility: intOrNull(parsed[i][7]), // 1 = public (default); 2 = private;
                        status: intOrNull(parsed[i][8]), // 1 = active (default); 2 = inactive; 3 = deleted;
                        langId: intOrNull(parsed[i][9]), // default EN
                        parentId: intOrNull(parsed[i][10]),
                        gadmId0: intOrNull(parsed[i][11]),
                        gadmId1: intOrNull(parsed[i][12]),
                        gadmId2: intOrNull(parsed[i][13]),
                        gadmId3: intOrNull(parsed[i][14]),
                        gadmObjectId: intOrNull(parsed[i][15]),
                        HASC: parsed[i][16],
                        creatorId: req.user.realmUserId, // add from realmUserId instead of user id
                        ownerId: req.user.realmUserId // add from realmUserId instead of user id
                    };

                    newUoa.messages = [];
                    debug(newUoa);
                    var valid = true;
                    if (vl.isNull(newUoa.name)) {
                        newUoa.messages.push('`Name` must not be empty');
                    } else {
                        var isExist = yield thunkQuery(UnitOfAnalysis.select().where(UnitOfAnalysis.name.equals(newUoa.name)));
                        if (isExist[0]) {
                            newUoa.messages.push('Already exists');
                            valid = false;
                        } else {
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
                                    newUoa.messages.push('Target Type with Id `' + newUoa.unitOfAnalysisType.toString() + '` does not exist in database');
                                    valid = false;
                                }
                            }
                            // visibility
                            if (!newUoa.visibility) {
                                // 1 = public (default); 2 = private;
                                newUoa.visibility = 1;
                            } else {
                                // check that specified visibility value is correct
                                if ([1, 2].indexOf(newUoa.visibility) === -1) {
                                    newUoa.messages.push('Target Visibility `' + newUoa.visibility.toString() + '` does not correct (1 = public (default); 2 = private)');
                                    valid = false;
                                }
                            }
                            // status
                            if (!newUoa.status) {
                                // 1 = active (default); 2 = inactive; 3 = deleted;
                                newUoa.status = 1;
                            } else {
                                // check that specified status value is correct
                                if ([1, 2, 3].indexOf(newUoa.status) === -1) {
                                    newUoa.messages.push('Target Status `' + newUoa.status.toString() + '` does not correct (1 = active (default); 2 = inactive; 3 = deleted)');
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
                                    newUoa.messages.push('Language with Id `' + newUoa.langId.toString() + '` does not exist in database');
                                    valid = false;
                                }
                            }
                            // shortName
                            if (vl.isNull(newUoa.shortName)) {
                                newUoa.messages.push('`shortName` must not be empty');
                                valid = false;
                            }
                            // ISO
                            if (newUoa.ISO !== '' && (!vl.isAlpha(newUoa.ISO) || !vl.isLength(newUoa.ISO, {
                                min: 3,
                                max: 3
                            }))) {
                                newUoa.messages.push('`ISO` must not be 3 alpha symbols');
                                valid = false;
                            }
                            // ISO2
                            if (newUoa.ISO2 !== '' && (!vl.isAlpha(newUoa.ISO2) || !vl.isLength(newUoa.ISO2, {
                                min: 2,
                                max: 2
                            }))) {
                                newUoa.messages.push('`ISO2` must not be 2 alpha symbols');
                                valid = false;
                            }
                            // If valid, then created
                            var created;
                            if (valid) {
                                try {
                                    created = yield thunkQuery(UnitOfAnalysis.insert(_.pick(newUoa, UnitOfAnalysis.whereCol)).returning(UnitOfAnalysis.id));
                                } catch (e) {
                                    newUoa.messages.push(e);
                                    valid = false;
                                }
                            }

                            if (valid && created[0]) {
                                newUoa.id = created[0].id;
                                // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
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

function* uoaSoftDeleteHelper(req, productIds, deleteOption) {
    var thunkQuery = req.thunkQuery,
        UOAId = req.params.id;

    for (var i = 0; i < productIds.length; i++ ) {
        const productId = productIds[i].productId;

        // Check if project has ever been active
        var project = yield thunkQuery(
            Project
                .select(
                    Project.star()
                )
                .from(
                    Project
                        .leftJoin(Product)
                        .on(Product.projectId.equals(Project.id))
                )
                .where(
                    Product.id.equals(productId)
                )
        );

        if (_.first(project)) {
            // If project is not active, delete UAO without any issues
            if (_.first(project).status === 0) {

                yield thunkQuery(
                    'UPDATE "ProductUOA"' +
                    'SET "isDeleted" = (to_timestamp(' + Date.now() +
                    '/ 1000.0)) WHERE "UOAid" = ' + UOAId +
                    'AND "productId" = ' + productId
                );

                // Soft delete the task with that UAO ID
                yield thunkQuery(
                    'UPDATE "Tasks"' +
                    'SET "isDeleted" = (to_timestamp(' + Date.now() +
                    '/ 1000.0)) WHERE "productId" = ' + productId +
                    'AND "uoaId" = ' + UOAId
                );

                if (deleteOption === 1) {
                    yield thunkQuery(
                        'UPDATE "UnitOfAnalysis"' +
                        'SET "isDeleted" = (to_timestamp(' + Date.now() +
                        '/ 1000.0)) WHERE "id" = ' + UOAId
                    );

                    yield common.bumpProjectLastUpdated(req, project[0].id);

                }
            } else { // Project is active and we have to do other checks.

                // check if there are any tasks assigned
                var tasks = yield thunkQuery(
                    'SELECT "Tasks".* ' +
                    'FROM "Tasks" ' +
                    'WHERE "Tasks"."uoaId" = ' + UOAId +
                    'AND "Tasks"."productId" = ' + productId
                );

                if (!_.first(tasks)) {
                    // Soft delete the UOA from the Product UAO Table
                    yield thunkQuery(
                        'UPDATE "ProductUOA"' +
                        'SET "isDeleted" = (to_timestamp(' + Date.now() +
                        '/ 1000.0)) WHERE "UOAid" = ' + UOAId +
                        'AND "productId" = ' + productId
                    );

                    if (deleteOption === 1) {
                        // Soft delete from the UOA table
                        yield thunkQuery(
                            'UPDATE "UnitOfAnalysis"' +
                            'SET "isDeleted" = (to_timestamp(' + Date.now() +
                            '/ 1000.0)) WHERE "id" = ' + UOAId
                        );
                        yield common.bumpProjectLastUpdated(req, project[0].id);
                    }

                } else {
                    const modifiedTasksList = yield * common.getCompletenessForTask(req, tasks);

                    if (_.first(modifiedTasksList).isComplete === true) {
                        throw new HttpError(403, 'Cannot delete UOA of already completed task');
                    } else {

                        // Get the product data in order to get survey ID
                        const productData = yield thunkQuery(
                            Product.select().from(Product).where(Product.id.equals(productId))
                        );

                        const surveyId = _.first(productData).surveyId;

                        const surveyAnswers = yield common.getUsersWithSurveyAnswers(surveyId, req.headers.authorization);

                        if (surveyAnswers.body !== 0) {
                            throw new HttpError(403, 'Cannot delete UOA with answered questions');
                        }

                        // Soft delete the UOA from the Product UAO Table
                        yield thunkQuery(
                            'UPDATE "ProductUOA"' +
                            'SET "isDeleted" = (to_timestamp(' + Date.now() +
                            '/ 1000.0)) WHERE "UOAid" = ' + UOAId +
                            'AND "productId" = ' + productId
                        );

                        // Soft delete the task with that UAO ID
                        yield thunkQuery(
                            'UPDATE "Tasks"' +
                            'SET "isDeleted" = (to_timestamp(' + Date.now() +
                            '/ 1000.0)) WHERE "productId" = ' + productId +
                            'AND "uoaId" = ' + UOAId
                        );

                        if (deleteOption === 1) {
                            yield thunkQuery(
                                'UPDATE "UnitOfAnalysis"' +
                                'SET "isDeleted" = (to_timestamp(' + Date.now() +
                                '/ 1000.0)) WHERE "id" = ' + UOAId
                            );
                            yield common.bumpProjectLastUpdated(req, project[0].id);
                        }
                    }
                }
            }
        } else {
            if (deleteOption === 1) {
                yield thunkQuery(
                    'UPDATE "UnitOfAnalysis"' +
                    'SET "isDeleted" = (to_timestamp(' + Date.now() +
                    '/ 1000.0)) WHERE "id" = ' + UOAId
                );
            }
        }
    }
}
