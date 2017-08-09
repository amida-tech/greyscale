
'use strict';

var client = require('../db_bootstrap'),
    _ = require('underscore'),
    config = require('../../config'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    crypto = require('crypto'),
    Project = require('../models/projects'),
    Product = require('../models/products'),
    Workflow = require('../models/workflows'),
    Survey = require('../models/surveys'),
    SurveyQuestion = require('../models/survey_questions'),
    AccessMatrix = require('../models/access_matrices'),
    Organization = require('../models/organizations'),
    User = require('../models/users'),
    co = require('co'),
    Query = require('../util').Query,
    vl = require('validator'),
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
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

    aggregate: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var projectList = [];
        var aggregateObject = {};
        var workflowIDs = [];

        co(function* () {
            var projects = yield thunkQuery(Project.select().from(Project), req.query);

            if (!projects) {
                throw new HttpError(404, 'No projects found');
            } else {
                for (var i = 0; i < projects.length; i++) {

                    // List of users that belong to the organization of a particular project
                    var userList = yield thunkQuery(
                        User
                            .select(
                                User.id
                            )
                            .from(
                                User
                                    .leftJoin(Project)
                                    .on(User.organizationId.equals(projects[i].organizationId))
                            )
                            .where(User.roleID.notEquals(1))
                    );

                    var stages = yield thunkQuery(
                        WorkflowSteps
                            .select(
                                WorkflowSteps.star(),
                                'array_agg(row_to_json("WorkflowStepGroups" .*)) as userGroups'
                            )
                            .from(
                                WorkflowSteps
                                    .leftJoin(Workflow)
                                    .on(WorkflowSteps.workflowId.equals(Workflow.id))
                                    .leftJoin(Product)
                                    .on(Product.id.equals(Workflow.productId))
                                    .leftJoin(WorkflowStepGroup)
                                    .on(WorkflowStepGroup.stepId.equals(WorkflowSteps.id))
                            )
                            .where(Product.projectId.equals(projects[i].id))
                            .group(WorkflowSteps.id)
                    );

                    // Add unique workflowID's to a new list
                    for (var index = 0; index < stages.length; index++) {
                        if (stages[index].workflowId && !(workflowIDs.indexOf(stages[index].workflowId) >= 0)) {
                            workflowIDs.push(stages[index].workflowId);
                        }
                    }

                    var productIDs = yield thunkQuery(
                        Product
                            .select(
                                Product.id
                            )
                            .from(
                                Product
                                    .leftJoin(Project)
                                    .on(Product.projectId.equals(projects[i].id))
                            )
                    );

                    var userGroups = yield thunkQuery(
                        UserGroup
                            .select(
                                UserGroup.groupId
                            )
                            .from(
                                Group
                                    .leftJoin(UserGroup)
                                    .on(UserGroup.groupId.equals(Group.id))
                                    .leftJoin(Project)
                                    .on(Group.organizationId.equals(projects[i].organizationId))
                                    .leftJoin(User)
                                    .on(UserGroup.userId.equals(User.id))
                            )
                    );

                    var subjects = yield thunkQuery(
                        UnitOfAnalysis
                            .select(
                                UnitOfAnalysis.name
                            )
                            .from(
                                UnitOfAnalysis
                                    .leftJoin(UserUOA)
                                    .on(UnitOfAnalysis.id.equals(UserUOA.UOAid))
                                    .leftJoin(User)
                                    .on(User.id.equals(UserUOA.UserId))
                            )
                            .where(User.organizationId.equals(projects[i].organizationId))
                    );

                    aggregateObject.id = projects[i].id;
                    aggregateObject.name = projects[i].codeName;
                    aggregateObject.lastUpdated = null; // need to figure out wha this is
                    aggregateObject.status = projects[i].status;
                    aggregateObject.users = userList;
                    aggregateObject.stages = stages;
                    aggregateObject.userGroups = userGroups;
                    aggregateObject.subjects = subjects;
                    aggregateObject.workflowIDs = workflowIDs;
                    aggregateObject.productIDs = productIDs;
                }
                projectList.push(aggregateObject);
            }
            return projectList;
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

        co(function* () {
            return yield thunkQuery(
                Project.delete().where(Project.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'projects',
                entity: req.params.id,
                info: 'Delete project'
            });
            res.status(204).end();
        }, function (err) {
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
            req.body = _.extend(req.body, {
                status: 1
            });
            req.body = _.extend(req.body, {
                userAdminId: req.user.realmUserId
            }); // add from realmUserId instead of user id
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

    if (req.user.roleID === 1) {
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

    if (orgId) {
        var isExistOrg = yield thunkQuery(
            Organization.select().where(Organization.id.equals(orgId))
        );
        if (!_.first(isExistOrg)) {
            throw new HttpError(
                403,
                'Organization with id = ' + orgId + ' does not exist'
            );
        }
        req.body.organizationId = orgId;
    }

    if (typeof req.body.status !== 'undefined') {
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
