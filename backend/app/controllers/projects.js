'use strict';

var client = require('../db_bootstrap'),
    _ = require('underscore'),
    config = require('../../config'),
    common = require('../services/common'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    crypto = require('crypto'),
    Project = require('../models/projects'),
    Product = require('../models/products'),
    Workflow = require('../models/workflows'),
    WorkflowSteps = require('../models/workflow_steps'),
    WorkflowStepGroup = require('../models/workflow_step_groups'),
    Survey = require('../models/surveys'),
    SurveyQuestion = require('../models/survey_questions'),
    AccessMatrix = require('../models/access_matrices'),
    Organization = require('../models/organizations'),
    Group = require('../models/groups'),
    UserGroup = require('../models/user_groups'),
    User = require('../models/users'),
    UnitOfAnalysis = require('../models/uoas'),
    ProductUOA = require('../models/product_uoa'),
    ProjectUser = require('../models/project_users'),
    ProjectUserGroup = require('../models/project_user_groups'),
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

    listAll: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var projectList = [];

        co(function* () {
            var projects = yield thunkQuery(Project.select().from(Project), req.query);

            if (!_.first(projects)) {
                throw new HttpError(404, 'No projects found');
            } else {
                for (var i = 0; i < projects.length; i++) {
                    var product = yield thunkQuery(
                        Product.select(Product.id, Product.surveyId).from(Product).where(Product.projectId.equals(projects[i].id))
                    );

                    var productId = _.first(_.map(product, 'id'));
                    var flags = 0;
                    if (productId) {
                        var workflowId = yield thunkQuery(
                            Workflow.select(Workflow.id).from(Workflow).where(Workflow.productId.equals(productId))
                        );
                        console.log(productId);
                        flags = yield thunkQuery(
                            'SELECT DISTINCT "Discussions"."questionId" FROM "Discussions" ' +
                            'JOIN "Tasks" on "Discussions"."taskId" = "Tasks"."id" WHERE ' +
                            '"Tasks"."productId" = ' + productId + ' AND "Discussions".' +
                            '"isResolve" = false GROUP BY "Discussions"."questionId"'
                        );
                        flags = flags.length;
                        console.log("***************************");
                        console.log(flags);
                        console.log(flags.length);
                    }

                    var subjects = yield thunkQuery(
                        UnitOfAnalysis
                            .select(
                                UnitOfAnalysis.name, UnitOfAnalysis.id
                            )
                            .from(
                                UnitOfAnalysis
                                    .leftJoin(ProductUOA)
                                    .on(UnitOfAnalysis.id.equals(ProductUOA.UOAid))
                                    .leftJoin(Product)
                                    .on(ProductUOA.productId.equals(Product.id))
                            )
                            .where(Product.projectId.equals(projects[i].id)
                            .and(ProductUOA.isDeleted.isNull()))
                    );

                    projectList.push({
                        id: projects[i].id,
                        name: projects[i].codeName,
                        lastUpdated: null,
                        status: projects[i].status,
                        productId,
                        surveyId: (_.first(_.map(product, 'surveyId')) || null),
                        workflowId: _.first(_.map(workflowId, 'id')),
                        users: [],
                        stages: [],
                        userGroups: [],
                        subjects,
                        flags,
                        firstActivated: projects[i].firstActivated,
                    });
                }
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
        var aggregateObject = {};

        co(function* () {
            var project = yield thunkQuery(Project.select().from(Project).where(Project.id.equals(req.params.id)), req.query);

            if (!_.first(project)) {
                throw new HttpError(404, 'No project found');
            }  else {
                project = project[0];
                var userList = yield thunkQuery( // List of users that belong to the organization of a particular project
                    ProjectUser
                        .select(ProjectUser.userId)
                        .from(ProjectUser)
                        .where(ProjectUser.projectId.equals(project.id))
                );

                var stages = yield thunkQuery(
                    WorkflowSteps
                        .select(
                            WorkflowSteps.star(),
                            'array_agg(row_to_json("WorkflowStepGroups" .*)) as "userGroups"'
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
                        .where(Product.projectId.equals(project.id).and(WorkflowSteps.isDeleted.isNull()))
                        .group(WorkflowSteps.id)
                );

                // Add unique workflowID's to a new list
                for (var index = 0; index < stages.length; index++) {
                    if (!stages[index].userGroups[0]) {
                        stages[index].userGroups = [];
                    } else {
                        stages[index].userGroups = _.map(stages[index].userGroups, 'groupId');
                    }
                }

                var product = yield thunkQuery(
                    Product.select(Product.id, Product.surveyId).from(Product).where(Product.projectId.equals(project.id))
                );

                var productId = _.first(_.map(product, 'id'));
                var surveyId = _.first(_.map(product, 'surveyId'));

                var workflowId = yield thunkQuery(
                    Workflow.select(Workflow.id).from(Workflow).where(Workflow.productId.equals(productId))
                );

                var userGroups = yield thunkQuery(
                    Group
                        .select(
                            Group.star(),
                            'array_agg(row_to_json("Users" .*)) as users'
                        )
                        .from(
                            Group
                                .leftJoin(UserGroup)
                                .on(UserGroup.groupId.equals(Group.id))
                                .leftJoin(User)
                                .on(User.id.equals(UserGroup.userId))
                                .leftJoin(ProjectUserGroup)
                                .on(ProjectUserGroup.groupId.equals(Group.id))
                        )
                        .where(ProjectUserGroup.projectId.equals(project.id))
                        .group(Group.id)
                );

                userGroups.map((userGroupObject) =>  {
                    if (userGroupObject.users[0] !== null) {
                        userGroupObject.users = userGroupObject.users.map((user) => user.id);
                    }
                    return userGroupObject;
                });

                var subjects = yield thunkQuery(
                    UnitOfAnalysis
                        .select(
                            UnitOfAnalysis.name, UnitOfAnalysis.id
                        )
                        .from(
                            UnitOfAnalysis
                                .leftJoin(ProductUOA)
                                .on(UnitOfAnalysis.id.equals(ProductUOA.UOAid))
                                .leftJoin(Product)
                                .on(ProductUOA.productId.equals(Product.id))
                        )
                        .where(Product.projectId.equals(project.id)
                        .and(ProductUOA.isDeleted.isNull()))
                );

                aggregateObject.id = project.id;
                aggregateObject.name = project.codeName;
                aggregateObject.lastUpdated = null; // need to figure out wha this is
                aggregateObject.status = project.status;
                aggregateObject.users = _.map(userList, 'userId');
                aggregateObject.stages = stages;
                aggregateObject.userGroups = userGroups;
                aggregateObject.subjects = subjects;
                aggregateObject.productId = productId;
                aggregateObject.surveyId = surveyId;
                aggregateObject.workflowId = _.first(_.map(workflowId, 'id'));
                aggregateObject.firstActivated = project.firstActivated;
            }

            return aggregateObject;
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
            var updateObj = _.pick(req.body, ['title', 'description', 'startTime', 'closeTime', 'status', 'codeName', 'firstActivated']);
            var result = false;
            if (Object.keys(updateObj).length) {

                var project = yield thunkQuery(
                    Project.select().where(Project.id.equals(req.params.id))
                );

                // Update firstActivated if the status was changed from 0 to 1
                if (parseInt(updateObj.status) === 1 && _.first(project).firstActivated === null) {
                    updateObj.firstActivated = new Date();
                }
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
            res.status(202).json(true);
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

            req.body = _.extend(req.body, {
                userAdminId: req.user.realmUserId
            }); // add from realmUserId instead of user id
            var result = _.first(yield thunkQuery(
                Project
                .insert(_.pick(req.body, Project.table._initialConfig.columns))
                .returning(Project.id)
            ));

            result.name = req.body.codeName;
            result.status = 0;

            // Having it automatically insert into products and workflows for now.
            result.productId = _.first(yield thunkQuery(
                Product.insert({
                    title: result.name,
                    description: req.body.description,
                    projectId: result.id,
                    status: 1,
                }).returning(Product.id)
            )).id;

            result.workflowId = _.first(yield thunkQuery(
                Workflow.insert({
                    name: result.name,
                    description: req.body.description,
                    productId: result.productId,
                }).returning(Workflow.id)
            )).id;

            result.users = [];
            result.stages = [];
            result.userGroups = [];
            result.subjects = [];

            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'projects',
                entity: data.id,
                info: 'Add new project'
            });
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    userAssignment: function (req, res, next) {
        co(function*() {
            var projectExist = yield * common.checkRecordExistById(req, 'Projects', 'id', req.params.projectId);
            var userExist = yield * common.checkRecordExistById(req, 'Users', 'id',  req.body.userId, 'isDeleted');

            if (projectExist === true && userExist === true) {
                var insertedData =  yield * common.insertProjectUser(req, req.body.userId, req.params.projectId);

                if (insertedData) {
                    return {
                        'message': 'Successfully Inserted data',
                        'data': insertedData
                    };
                }
            } else {
                throw new HttpError(404, 'Project or User not found');
            }
        }).then(function (data) {
            res.status(202).json(data);
        }, function (err) {
            next(err);
        });
    },

    userRemoval: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var projectExist = yield * common.checkRecordExistById(req, 'ProjectUsers', 'projectId', req.params.projectId);
            var userExist = yield * common.checkRecordExistById(req, 'ProjectUsers', 'userId', req.params.userId);

            if (projectExist === true && userExist === true) {

                yield thunkQuery(
                    'DELETE FROM "ProjectUsers" WHERE "ProjectUsers"."projectId" = ' +
                    req.params.projectId + ' AND "ProjectUsers"."userId" = ' + req.params.userId
                );

                var productId = _.first(_.map((yield thunkQuery(
                    Product.select(Product.id).from(Product).where(Product.projectId.equals(req.params.projectId))
                )), 'id'));

                if (productId) {
                    return yield thunkQuery(
                        'UPDATE "Tasks"' +
                        ' SET "isDeleted" = (to_timestamp('+ Date.now() +
                        '/ 1000.0)) WHERE "productId" = ' + productId +
                        ' AND ' + req.params.userId + ' = ANY("Tasks"."userIds")'
                    );
                } else {
                    throw new HttpError(404, ' Product ID not found. Unable to delete task');
                }
            } else {
                throw new HttpError(404, ' Project or User not found');
            }
        }).then(function (data) {
            res.status(202).json(data)
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
        if (Project.statuses.indexOf(parseInt(req.body.status)) === -1) {
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
