var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    Project = require('app/models/projects'),
    Product = require('app/models/products'),
    Workflow = require('app/models/workflows'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    AccessMatrix = require('app/models/access_matrices'),
    Translation = require('app/models/translations'),
    Language = require('app/models/languages'),
    Essence = require('app/models/essences'),
    Organization = require('app/models/organizations'),
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    getTranslateQuery = require('app/util').getTranslateQuery,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
        	req.query.realm = req.param('realm');
//            return yield thunkQuery(Project.select().from(Project), _.omit(req.query, 'offset', 'limit', 'order'));
            return yield thunkQuery(Project.select().from(Project), req.query);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var project = yield thunkQuery(Project.select().from(Project).where(Project.id.equals(req.params.id)),
            		{'realm': req.param('realm')});
            if (!_.first(project)) {
                throw new HttpError(404, 'Not found');
            } else {
                return _.first(project);
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    delete: function (req, res, next) {
        var q = Project.delete().where(Project.id.equals(req.params.id));
        query(q, {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    editOne: function (req, res, next) {
        co(function* () {
            yield * checkProjectData(req);
            var updateObj = _.defaults(_.pick(req.body, ['title', 'description', 'startTime', 'closeTime', 'status', 'codeName']),
            		{'realm': req.param('realm')});
            var result = false;
            if (Object.keys(updateObj).length) {
                result = yield thunkQuery(
                    Project
                    .update(updateObj)
                    .where(Project.id.equals(req.params.id))
                );
            }
            return result;
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    productList: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                )
                .where(Product.projectId.equals(req.params.id)),
                {'realm': req.param('realm')} 
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    surveyList: function (req, res, next) {
        co(function* () {
            var data = yield thunkQuery(
                Survey
                .select(
                    Survey.star(),
                    'array_agg(row_to_json("SurveyQuestions".*) ORDER BY "SurveyQuestions"."position") as questions'
                )
                .from(
                    Survey
                    .leftJoin(SurveyQuestion)
                    .on(Survey.id.equals(SurveyQuestion.surveyId))
                )
                .where(Survey.projectId.equals(req.params.id))
                .group(Survey.id)
            );
            return data;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            yield * checkProjectData(req);

            var result = yield thunkQuery(
                Project
                .insert(_.defaults(_.pick(req.body, Project.table._initialConfig.columns),{'realm': req.param('realm')}))
                .returning(Project.id)
            );
            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    csvUsers: function (req, res, next) {
        // fields order
        // EMAIL,FIRST-NAME,LAST-NAME,COMPANY-ADMIN,STATUS,TIMEZONE,
        // LOCATION,CELL,PHONE,ADDRESS,LANG (E.G. EN),BIO,LEVEL-NOTIFY

        var csv = require('csv');
        var fs = require('fs');

        co(function* () {



            var upload = new Promise(function(resolve, reject){
                if(req.files.image) {

                    fs.readFile(req.files.image.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        resolve(data);
                    });
                }else{
                    reject('File has not uploaded');
                }
            });

            var parser = new Promise(function(resolve, reject){
                csv.parse(data, function (err, data) {
                    //console.log(data);
                    //for (var i in data) {
                    //    if (i != 0) { // skip first string
                    //        console.log('email = ' + data[i][0] + ',firstname=' + data[i][1] + ',lastname=' + data[i][2]);
                    //        var newUser = {
                    //            email: data[i][0],
                    //            firstName: data[i][1],
                    //            lastName: data[i][2]
                    //        }
                    //        var isExist = yield thunkQuery(User.select().where(User.email.equals(newUser.email)));
                    //        console.log(isExist);
                    //    }
                    //}
                });
            });

            var doUpload = yield upload.then(
                function(data){
                    return data;
                },function(err){
                    return err;
                }
            );
            if(doUpload.code){
                throw new HttpError(403, 'Upload file problem');
            }else{
                //parser.then(
                //    function(data){
                //
                //    },function(err){
                //
                //    }
                //);
                return doUpload;
            }
            //return data;

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }

};

function* checkProjectData(req) {
    if (!req.params.id) { // create
        if (!req.body.matrixId || !req.body.organizationId || !req.body.codeName) {
            throw new HttpError(
                403,
                'matrixId, organizationId and codeName fields are required'
            );
        }

        if (req.body.organizationId) {
            var isExistOrg = yield thunkQuery(
                Organization.select().where(Organization.id.equals(req.user.organizationId)), {'realm': req.param('realm')}
            );
            if (!_.first(isExistOrg)) {
                throw new HttpError(
                    403,
                    'By some reason cannot find your organization (id = ' + req.user.organizationId + ')'
                );
            }
        }

        req.body.organizationId = req.user.organizationId;
    }

    if (req.body.matrixId) {
        var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
        if (!_.first(isExistMatrix)) {
            throw new HttpError(403, 'Matrix with this id does not exist');
        }
    }

    var isExistCode;
    if (req.params.id) { // update
        if (req.body.codeName) {
            isExistCode = yield thunkQuery(
                Project.select().from(Project)
                .where(Project.codeName.equals(req.body.codeName)
                    .and(Project.id.notEquals(req.params.id))),
               {'realm': req.param('realm')}
            );
            if (_.first(isExistCode)) {
                throw new HttpError(403, 'Project with this code has already exist');
            }
        }
    } else { // create
        if (req.body.codeName) {
            isExistCode = yield thunkQuery(
                Project.select().from(Project).where(Project.codeName.equals(req.body.codeName)),{'realm': req.param('realm')}
            );
            if (_.first(isExistCode)) {
                throw new HttpError(403, 'Project with this code has already exist');
            }
        }
    }

    var isExistOrg = yield thunkQuery(Organization.select().where(Organization.id.equals(req.body.organizationId)),
    		 {'realm': req.param('realm')});
    if (!_.first(isExistOrg)) {
        throw new HttpError(403, 'By some reason cannot find your organization');
    }

    //var isExistAdmin = yield thunkQuery(User.select().where(User.id.equals(req.body.adminUserId)),
    //		{'realm': req.param('realm')});
    //if (!_.first(isExistAdmin)) {
    //    throw new HttpError(403, 'User with this id does not exist (admin user id)');
    //}
    //
    //if (_.first(isExistAdmin).organizationId != req.user.organizationId) {
    //    throw new HttpError(403, 'This user cannot be an admin of this project, because he is not a member of project organization')
    //}

    req.body.organizationId = req.user.organizationId;


}
