'use strict';

var _ = require('underscore'),
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
    Organization = require('../models/organizations'),
    Group = require('../models/groups'),
    UserGroup = require('../models/user_groups'),
    User = require('../models/users'),
    Task = require('../models/tasks'),
    UnitOfAnalysis = require('../models/uoas'),
    ProductUOA = require('../models/product_uoa'),
    ProjectUser = require('../models/project_users'),
    ProjectUserGroup = require('../models/project_user_groups'),
    notifications = require('../controllers/notifications'),
    co = require('co'),
    Query = require('../util').Query,
    vl = require('validator'),
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query);

var notify = function (req, note0, entryId, taskId, essenceName, templateName) {
    co(function* () {
        var userTo, note;
        // notify
        var sentUsersId = []; // array for excluding duplicate sending
        var task = yield * common.getTask(req, taskId);
        var i;
        for (i in task.userIds) {
            if (sentUsersId.indexOf(task.userIds[i]) === -1) {
                if (req.user.id !== task.userIds[i]) { // don't send self notification
                    userTo = yield * common.getUser(req, task.userIds[i]);
                    note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                    notifications.notify(req, userTo, note, templateName);
                    // Send internal notification
                    yield common.sendSystemMessageWithMessageService(req, userTo.email, note.body);
                    sentUsersId.push(task.userIds[i]);
                }
            }
        }
        for (i in task.groupIds) {
            var usersFromGroup = yield * common.getUsersFromGroup(req, task.groupIds[i]);
            for (var j in usersFromGroup) {
                if (sentUsersId.indexOf(usersFromGroup[j].userId) === -1) {
                    if (req.user.id !== usersFromGroup[j].userId) { // don't send self notification
                        userTo = yield * common.getUser(req, usersFromGroup[j].userId);
                        note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                        notifications.notify(req, userTo, note, templateName);
                        // Send internal notification
                        yield common.sendSystemMessageWithMessageService(req, userTo.email, note.body);
                        sentUsersId.push(usersFromGroup[j].userId);
                    }
                }
            }
        }
    }).then(function () {
        debug('Created notifications `' + note0.action + '`');
    }, function (err) {
        error(JSON.stringify(err));
    });
};

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
            var projects = yield thunkQuery(
                'SELECT * FROM "Projects" ORDER BY "Projects"."lastUpdated" DESC'
            );

            if (!_.first(projects)) {
                return projectList;
            } else {
                for (var i = 0; i < projects.length; i++) {
                    var product = yield thunkQuery(
                        Product.select(Product.id, Product.surveyId).from(Product).where(Product.projectId.equals(projects[i].id))
                    );

                    var productId = _.first(_.map(product, 'id'));
                    var flags = 0;
                    var flagHistory = false;
                    var workflowId = null;
                    var stages = [];
                    if (productId) {
                        workflowId = yield thunkQuery(
                            Workflow.select(Workflow.id).from(Workflow).where(Workflow.productId.equals(productId))
                        );
                        workflowId = _.first(_.map(workflowId, 'id'));
                        flags = yield thunkQuery(
                            'SELECT DISTINCT "Discussions"."questionId" FROM "Discussions" ' +
                            'JOIN "Tasks" on "Discussions"."taskId" = "Tasks"."id" WHERE ' +
                            '"Tasks"."productId" = ' + productId + ' AND "Discussions".' +
                            '"isResolve" = false GROUP BY "Discussions"."questionId"'
                        );
                        flags = flags.length;
                        flagHistory = yield thunkQuery(
                            'SELECT COUNT("Discussions"."questionId") FROM "Discussions" ' +
                            'JOIN "Tasks" on "Discussions"."taskId" = "Tasks"."id" WHERE ' +
                            '"Tasks"."productId" = ' + productId
                        );
                        flagHistory = flagHistory.length > 0;
                        stages = yield thunkQuery(
                            WorkflowSteps
                                .select(
                                    WorkflowSteps.star())
                                .from(WorkflowSteps)
                                .where(WorkflowSteps.workflowId.equals(workflowId))
                                .and(WorkflowSteps.isDeleted.isNull())
                                .order(WorkflowSteps.position)
                        );
                        for (var index = 0; index < stages.length; index++) {
                            stages[index].userGroups = [];
                        }
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
                        lastUpdated: projects[i].lastUpdated,
                        status: projects[i].status,
                        productId,
                        surveyId: (_.first(_.map(product, 'surveyId')) || null),
                        workflowId,
                        users: [],
                        stages,
                        userGroups: [],
                        subjects,
                        flags,
                        flagHistory,
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
                        .order(WorkflowSteps.position)
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
                aggregateObject.lastUpdated = project.lastUpdated;
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

                // Ensure conditions are met if project status is being set to 1 (activated)
                if (parseInt(updateObj.status) === 1) {

                    // Check that the survey is published
                    const product = yield thunkQuery(
                        Product.select().from(Product).where(Product.projectId.equals(req.params.id))
                    );

                    const survey = yield common.getSurveyFromSurveyService(product[0].surveyId, req.headers.authorization);

                    if (survey.body.status !== 'published') {
                        throw new HttpError(400, 'Survey is not published, project cannot be started');
                    }

                    // check that project has at least one subject
                    const projectUOA = yield thunkQuery(
                        ProductUOA.select().from(ProductUOA).where(ProductUOA.productId.equals(product[0].id))
                    );

                    if (!_.first(projectUOA)) {
                        throw new HttpError(403, 'Project contains no subjects, project cannot be started');
                    }

                    // check that the project has at least one user
                    const projectUser = yield thunkQuery(
                        ProjectUser.select(ProjectUser.star()).from(ProjectUser).where(ProjectUser.projectId.equals(req.params.id))
                    );

                    if (!_.first(projectUser)) {
                        throw new HttpError(403, 'No user assigned to project, project cannot be started');
                    }

                    // check that the project has at least one user group assigned
                    const projectUserGroup = yield thunkQuery(
                        ProjectUserGroup.select().from(ProjectUserGroup).where(ProjectUserGroup.projectId.equals(req.params.id))
                    );

                    if (!_.first(projectUserGroup)) {
                        throw new HttpError(403, 'No user group assigned to project, project cannot be started');
                    }

                    // Check stages
                    const stages = yield thunkQuery(
                        WorkflowSteps
                            .select()
                            .from(
                                WorkflowSteps
                                    .leftJoin(Workflow)
                                    .on(WorkflowSteps.workflowId.equals(Workflow.id))
                            )
                            .where(Workflow.productId.equals(product[0].id)
                            .and(WorkflowSteps.isDeleted.isNull()))
                    );

                    if (!_.first(stages)) {
                        throw new HttpError(403, 'No stages assigned to project, project cannot be started');
                    }

                    for (var i=0; i < stages.length; i++) {
                        if (stages[i].title === '' || stages[i].startDate === null || stages[i].endDate === null) {
                            throw new HttpError(403, 'Stage is missing a property, project cannot be started');
                        }

                        // Check that the stage has at least one user group
                        const workflowStepGroup = yield thunkQuery(
                            WorkflowStepGroup.select()
                                .from(WorkflowStepGroup)
                                .where(WorkflowStepGroup.stepId.equals(stages[i].id))
                        );

                        if (!_.first(workflowStepGroup)) {
                            throw new HttpError(400, 'Stage is missing a user Group, project cannot be started');
                        }
                    }

                    // If this is the first time we are activating the project then set it to the current time
                    if (_.first(project).firstActivated === null) {
                        updateObj.firstActivated = new Date();
                    }
                }

                updateObj.lastUpdated = new Date();
                result = yield thunkQuery(
                    Project
                    .update(updateObj)
                    .where(Project.id.equals(req.params.id))
                );

                if (result) { // If the status was changed
                    if (parseInt(updateObj.status) ===1 || parseInt(updateObj.status) === 0) { // status was changed
                        const product = yield thunkQuery(
                            Product.select().from(Product).where(Product.projectId.equals(req.params.id))
                        );
                        // users with live task
                        const productUoas = yield thunkQuery(
                            ProductUOA.select().from(ProductUOA).where(ProductUOA.productId.equals(_.first(product).id)
                                .and(ProductUOA.currentStepId.isNotNull()))
                        );
                        //Get users with LiveTasks
                        let p;
                        const usersWithLiveTasks = [];
                        for (p = 0; p < productUoas.length; p++) {
                            const tasks = yield thunkQuery(
                                Task.select().from(Task).where(
                                    Task.productId.equals(productUoas[p].productId)
                                        .and(Task.uoaId.equals(productUoas[p].UOAid))
                                )
                            );
                            usersWithLiveTasks.push(_.first(tasks)); // Push user ids to list
                        }

                        // Email users based on active or in-active project
                        let emailBodyAndAction = {};
                        if (parseInt(updateObj.status) === 1 ) { // project made Active
                            emailBodyAndAction = {
                                action: 'Active',
                                body: 'Project set to active, please complete your task'
                            }
                        } else if (parseInt(updateObj.status) === 0) { // Project made in-active
                            emailBodyAndAction = {
                                action: 'In-Active',
                                body: 'Project set to in-active Please verify your task'
                            }
                        }
                        let u;
                        for (u = 0; u < usersWithLiveTasks.length; u++) {
                            notify(req, {
                                body: emailBodyAndAction.body,
                                action: emailBodyAndAction.action
                            }, usersWithLiveTasks[u].id, usersWithLiveTasks[u].id, 'Tasks', 'activateProject')
                        }
                    }
                }
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
            //TODO: Remove this from here. Product insert should be happening in product.js and just retrieved from here INBA-849
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

                yield common.bumpProjectLastUpdated(req, req.params.projectId);

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

                yield common.bumpProjectLastUpdated(req, req.params.projectId);

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
