var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    crypto = require('crypto'),
    Project = require('app/models/projects'),
    Product = require('app/models/products'),
    Workflow = require('app/models/workflows'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    AccessMatrix = require('app/models/access_matrices'),
    Organization = require('app/models/organizations'),
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    vl = require('validator'),
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(Project.select().from(Project), req.query);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var project = yield thunkQuery(Project.select().from(Project).where(Project.id.equals(req.params.id)));
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
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                Project.delete().where(Project.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'projects',
                entity: req.params.id,
                info: 'Delete project'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
    },

    editOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkProjectData(req);
            var updateObj = _.pick(req.body, ['title', 'description', 'startTime', 'closeTime', 'status', 'codeName']);
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
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'projects',
                entity: req.params.id,
                info: 'Update project'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    productList: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
                .where(Product.projectId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    surveyList: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
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
        var thunkQuery = req.thunkQuery;
        co(function* () {
            yield * checkProjectData(req);
            // patch for status
            req.body = _.extend(req.body, {status: 1});
            req.body = _.extend(req.body, {userAdminId: req.user.realmUserId}); // add from realmUserId instead of user id
            var result = yield thunkQuery(
                Project
                .insert(_.pick(req.body, Project.table._initialConfig.columns))
                .returning(Project.id)
            );
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'projects',
                entity: _.first(data).id,
                info: 'Add new project'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    }



};

function* checkProjectData(req) {
    var thunkQuery = req.thunkQuery;
    var orgId = req.user.organizationId;

    if(req.user.roleID === 1){
        orgId = req.body.organizationId;
    }

    if (!req.params.id) { // create
        if (!orgId || !req.body.codeName) {
            throw new HttpError(
                403,
                'organizationId and codeName fields are required'
            );
        }
    }

    if(orgId){
        var isExistOrg = yield thunkQuery(
            Organization.select().where(Organization.id.equals(orgId))
        );
        if (!_.first(isExistOrg)) {
            throw new HttpError(
                403,
                'Organization with id = ' + orgId + ' does not exist'
            );
        }
        var projects = yield thunkQuery(
            Project.select().where(Project.organizationId.equals(orgId))
        );
        if (projects.length) {
            throw new HttpError(400, 'You can create only one project for each organization');
        }
        req.body.organizationId = orgId;
    }

    if(typeof req.body.status !== 'undefined'){
        if (Project.statuses.indexOf(req.body.status) === -1) {
            throw new HttpError(403, 'Status can be only 1 (active) and 0 (inactive)');
        }
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
                    .and(Project.id.notEquals(req.params.id)))
            );
            if (_.first(isExistCode)) {
                throw new HttpError(403, 'Project with this code has already exist');
            }
        }
    } else { // create
        if (req.body.codeName) {
            isExistCode = yield thunkQuery(
                Project.select().from(Project).where(Project.codeName.equals(req.body.codeName))
            );
            if (_.first(isExistCode)) {
                throw new HttpError(403, 'Project with this code has already exist');
            }
        }
    }

}
