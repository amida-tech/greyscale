var
    _ = require('underscore'),
    common = require('app/services/common'),
    Task = require('app/models/tasks'),
    TaskUserState = require('app/models/taskuserstates'),
    Survey = require('app/models/surveys'),
    Product = require('app/models/products'),
    Group = require('app/models/groups'),
    WorkflowStep = require('app/models/workflow_steps'),
    ProductUOA = require('app/models/product_uoa'),
    UOA = require('app/models/uoas'),
    Project = require('app/models/projects'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    sTaskUserState = require('app/services/taskuserstates'),
    pgEscape = require('pg-escape');

var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }
    var oTaskUserState = new sTaskUserState(req);

    this.getList = function () {
        return co(function* () {
            return thunkQuery(Attachment.select().from(Attachment), req.query);
        });
    };
    this.deleteTask = function (taskId) {
        return co(function* () {
            yield thunkQuery(
                Task.delete().where(Task.id.equals(taskId))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'tasks',
                entity: taskId,
                info: 'Delete task'
            });
        });
    };
    this.deleteTasks = function (productId, uoaId) {
        return co(function* () {
            var query = Task.delete()
                .where(
                Task.productId.equals(productId)
                    .and(Task.userIds.equals('{}'))
                    .and(Task.groupIds.equals('{}'))
            );
            if (uoaId) {
                query = query.and(Task.uoaId.equals(uoaId));
            }

            yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'tasks',
                entity: null,
                entities: {
                    productId: productId,
                    uoaId: uoaId
                },
                quantity: 1,
                info: 'Delete all tasks for product `' + productId + '` subject `' + (uoaId ? uoaId : 'ALL') + '`'
            });
        });
    };
    this.getByProductUOA = function (productId, uoaId) {
        return co(function* () {
            return yield thunkQuery(
                Task.select()
                    .where(
                    Task.productId.equals(productId)
                    .and(Task.uoaId.equals(uoaId))
                    .and(Task.userIds.notEquals('{}')
                        .or(Task.groupIds.notEquals('{}'))
                    )
                )
            );
        });
    };
    this.getByProductAllUoas = function (productId) {
        return co(function* () {
            return yield thunkQuery(
                Task.select()
                    .where(
                    Task.productId.equals(productId)
                    .and(Task.userIds.notEquals('{}')
                        .or(Task.groupIds.notEquals('{}'))
                    )
                )
            );
        });
    };
    this.isPolicy = function (taskId) {
        return co(function* () {
            var policyId = yield thunkQuery(
                Task.select(
                    Survey.policyId
                )
                    .from(
                    Task
                        .leftJoin(Product)
                        .on(Task.productId.equals(Product.id))
                        .leftJoin(Survey)
                        .on(Product.surveyId.equals(Survey.id))
                )
                    .where(Task.id.equals(taskId)
                )
            );
            return (_.first(policyId) && policyId[0].policyId) ? true : false;
        });
    };
    this.isPolicyProduct = function (productId) {
        return co(function* () {
            var policyId = yield thunkQuery(
                Task.select(
                    Survey.policyId
                )
                    .from(
                    Product
                        .leftJoin(Survey)
                        .on(Product.surveyId.equals(Survey.id))
                )
                    .where(Product.id.equals(productId)
                )
            );
            return (_.first(policyId) && policyId[0].policyId) ? true : false;
        });
    };
    this.getProductTasks = function () {
        var self = this;
        return co(function* () {
            var isPolicy = yield self.isPolicyProduct(req.params.id);
            if (isPolicy) {
                var taskUsersIds =  yield self.getTaskUsersIdsByProduct(req.params.id);
                var tasks = yield self.getProductTasksExt('Comments');
                var tasksUsersStatuses = yield self.getTaskUsersStatuses('Comments', taskUsersIds.userIds);
                tasks = _.each(tasks, function (task) {
                    var usersStatus = [];
                    _.each(tasksUsersStatuses, function(userStatus){
                        if (userStatus.taskId === task.id) {
                            if (_.find(taskUsersIds.taskUserIds, function(item){
                                    return (item.taskId === userStatus.taskId && item.userId === userStatus.userId);
                                })) {
                                usersStatus.push(_.omit(userStatus, 'taskId'));
                            }
                        }
                    });
                    usersStatus = self.getNamedStatuses(usersStatus, 'status');
                    task.userStatuses = usersStatus;
                });
                return tasks;
            } else {
                return yield self.getProductTasksExt('Discussions');
            }
        });
    };
    this.getProductTasksExt = function (commentDiscussion) {
        var self = this;
        return co(function* () {
            var curStepAlias = 'curStep';
            return yield thunkQuery(
                Task
                    .select(
                    Task.star(),
                    self.taskStatus.flaggedColumn(commentDiscussion),
                    self.taskStatus.flaggedCountColumn(commentDiscussion),
                    self.taskStatus.flaggedFromColumn(commentDiscussion),
                    self.taskStatus.statusColumn(curStepAlias),
                    WorkflowStep.position,
                    '(' +
                    'SELECT max("SurveyAnswers"."created") ' +
                    'FROM "SurveyAnswers" ' +
                    'WHERE ' +
                    '"SurveyAnswers"."productId" = "Tasks"."productId" ' +
                    'AND "SurveyAnswers"."UOAid" = "Tasks"."uoaId" ' +
                    'AND "SurveyAnswers"."wfStepId" = "Tasks"."stepId" ' +
                    ') as "lastVersionDate"'
                )
                    .from(
                    Task
                        .leftJoin(WorkflowStep)
                        .on(Task.stepId.equals(WorkflowStep.id))
                        .leftJoin(Product)
                        .on(Task.productId.equals(Product.id))
                        .leftJoin(UOA)
                        .on(Task.uoaId.equals(UOA.id))
                        .leftJoin(ProductUOA)
                        .on(
                        ProductUOA.productId.equals(Task.productId)
                            .and(ProductUOA.UOAid.equals(Task.uoaId))
                    )
                        .leftJoin(WorkflowStep.as(curStepAlias))
                        .on(
                        ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                    )
                )
                    .where(Task.productId.equals(req.params.id))
            );
        });
    };
    this.getSelfTasks = function () {
        var self = this;
        return co(function* () {
            var userTasks = yield self.getUserTasks(req.user.id);
            var surveyTasks = yield self.getSelfTasksExt('Discussions', 'curStep', userTasks);
            var policyTasks = yield self.getSelfTasksExt('Comments', 'curStep', userTasks, true);
            var tasksUserStatus = yield self.getTasksUserStatus('Comments', req.user.id, userTasks);
            policyTasks = self.mergeTasksWithUserStatus(policyTasks, tasksUserStatus, 'userStatus');
            return _.union(surveyTasks, policyTasks);
        });
    };
    this.getUserTasks = function (userId) {
        var self = this;
        return co(function* () {
            var tasks = [];
            var query = 'SELECT DISTINCT ' +
            '"Tasks"."id" ' +
            'FROM "Tasks" ' +
            'INNER JOIN "UserGroups" ON ("Tasks"."groupIds" @> ARRAY["UserGroups"."groupId"]) ' +
            'INNER JOIN "Users" ON ("UserGroups"."userId" = "Users"."id") ' +
            pgEscape('WHERE ("Users"."id" = %s) ', userId) +
            'UNION ' +
            'SELECT DISTINCT' +
            '"Tasks"."id" ' +
            'FROM "Tasks" ' +
            pgEscape('WHERE ("Tasks"."userIds" @> \'{%s}\') ', userId);

            var taskIds = yield thunkQuery(query);
            if (_.first(taskIds)) {
                _.each(taskIds, function(item){
                    tasks.push(item.id);
                });
            }
            return tasks;
        });
    };
    this.getSelfTasksExt = function (commentDiscussion, curStepAlias, tasks, isPolicy) {
        var self = this;
        return co(function* () {
            var query = Task
                .select(
                Task.id,
                Task.title,
                Task.description,
                Task.created,
                Task.startDate,
                Task.endDate,
                'row_to_json("UnitOfAnalysis".*) as uoa',
                'row_to_json("Products".*) as product',
                'row_to_json("Projects".*) as project',
                'row_to_json("Surveys".*) as survey',
                'row_to_json("WorkflowSteps") as step',
                self.taskStatus.flaggedColumn(commentDiscussion),
                self.taskStatus.flaggedCountColumn(commentDiscussion),
                self.taskStatus.flaggedFromColumn(commentDiscussion),
                self.taskStatus.statusColumn(curStepAlias)
            )
                .from(
                Task
                    .leftJoin(UOA)
                    .on(Task.uoaId.equals(UOA.id))
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(Project)
                    .on(Product.projectId.equals(Project.id))
                    .leftJoin(Survey)
                    .on(Product.surveyId.equals(Survey.id))
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))
                    .leftJoin(ProductUOA)
                    .on(
                    ProductUOA.productId.equals(Task.productId)
                        .and(ProductUOA.UOAid.equals(Task.uoaId))
                )
                    .leftJoin(WorkflowStep.as(curStepAlias))
                    .on(
                    ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                )
            );
            if (isPolicy) {
                query = query.where(
                    sql.array(Task.id).containedBy('{' + tasks + '}')
                        .and(Product.status.equals(1))
                        .and(Survey.policyId.isNotNull())
                );
            } else {
                query = query.where(
                    sql.array(Task.id).containedBy('{' + tasks + '}')
                        .and(Product.status.equals(1))
                        .and(Survey.policyId.isNull())
                );
            }
            return yield thunkQuery(query, req.query);
        });
    };
    this.getTaskExt = function (commentDiscussion, curStepAlias) {
        var self = this;
        return co(function* () {
            var taskExt = yield thunkQuery(
                Task
                    .select(
                    Task.star(),
                    self.taskStatus.flaggedColumn(commentDiscussion),
                    self.taskStatus.flaggedCountColumn(commentDiscussion),
                    self.taskStatus.flaggedFromColumn(commentDiscussion),
                    self.taskStatus.statusColumn(curStepAlias)
                )
                    .from(
                    Task
                        .leftJoin(Product)
                        .on(Task.productId.equals(Product.id))
                        .leftJoin(WorkflowStep)
                        .on(Task.stepId.equals(WorkflowStep.id))
                        .leftJoin(ProductUOA)
                        .on(
                        ProductUOA.productId.equals(Task.productId)
                            .and(ProductUOA.UOAid.equals(Task.uoaId))
                    )
                        .leftJoin(WorkflowStep.as(curStepAlias))
                        .on(
                        ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                    )
                )
                    .where(Task.id.equals(req.params.id))
            );
            if (!_.first(taskExt)) {
                throw new HttpError(403, 'Not found');
            }
            return _.first(taskExt);
        });
    };
    this.getTaskSurvey = function () {
        return this.getTaskExt('Discussions', 'curStep');
    };
    this.getTaskPolicy = function () {
        return this.getTaskExt('Comments', 'curStep');
    };
    this.getTaskUsersStatuses = function (commentDiscussion, users, taskId) {

        // get all TaskUserStates for lists of users and tasks
        var tasks = taskId ? [taskId] : null;
        return oTaskUserState.getByLists(tasks, users);

    };
    this.getTasksUserStatus = function (commentDiscussion, userId, tasks) {

        // get all TaskUserStates for lists of users and tasks
        return oTaskUserState.getByLists(tasks, [userId]);

    };
    this.getNamedStatuses = function (detailStatuses, status) {
        return _.each(detailStatuses, function(item, i, arr){
            //item = this.getNamedItemStatus(item, status);
            item[status] = TaskUserState.getStatus(item.stateId);
            arr[i] = _.pick(item, ['userId', status])
        }, this);
    };
    this.mergeTasksWithUserStatus = function (tasks, statuses, statusName) {
        tasks = _.each(tasks, function(item){
            var status = _.findWhere(statuses, {taskId: item.id});
            if (typeof status !== 'undefined') {
                //status = this.getNamedItemStatus(status, statusName);
                //item[statusName] = status[statusName];
                item[statusName] = TaskUserState.getStatus(status.stateId);
            }
        }, this);
        return tasks;
    };
    this.getUsersAndGroups = function (taskId) {
        return co(function* () {
            var userTo, groupTo, usersFromGroup;
            var users = [];
            var groups = [];
            var chkUsers = [];
            var chkGroups = [];
            var task = yield * common.getTask(req, taskId);
            var taskUsers = task.userIds;
            for (var i in taskUsers) {
                if (chkUsers.indexOf(taskUsers[i]) === -1) {
                    chkUsers.push(taskUsers[i]);
                    userTo = yield * common.getUser(req, taskUsers[i]);
                    users.push({
                        userId: userTo.id,
                        firstName: userTo.firstName,
                        lastName: userTo.lastName,
                        email: userTo.email
                    });
                }
            }
            var taskGroups = task.groupIds;
            for (i in taskGroups) {
                if (chkGroups.indexOf(taskGroups[i]) === -1) {
                    chkGroups.push(taskGroups[i]);
                    groupTo = yield * common.getEntity(req, taskGroups[i], Group, 'id');
                    groups.push({
                        groupId: groupTo.id,
                        title: groupTo.title
                    });
                    usersFromGroup = yield * common.getUsersFromGroup(req, taskGroups[i]);
                    for (var j in usersFromGroup) {
                        if (chkUsers.indexOf(usersFromGroup[j].userId) === -1) {
                            userTo = yield * common.getUser(req, usersFromGroup[j].userId);
                            users.push({
                                userId: userTo.id,
                                firstName: userTo.firstName,
                                lastName: userTo.lastName,
                                email: userTo.email
                            });
                            chkUsers.push(usersFromGroup[j].userId);
                        }
                    }
                }
            }

            return {
                users: users,
                groups: groups
            };
        });
    };
    this.getUsersIdsByTask = function (taskId) {
        return co(function* () {
            var usersFromGroup;
            var users = [];
            var task = yield * common.getTask(req, taskId);
            var taskUsers = task.userIds;
            for (var i in taskUsers) {
                if (users.indexOf(taskUsers[i]) === -1) {
                    users.push(taskUsers[i]);
                }
            }
            var taskGroups = task.groupIds;
            for (i in taskGroups) {
                usersFromGroup = yield * common.getUsersFromGroup(req, taskGroups[i]);
                for (var j in usersFromGroup) {
                    if (users.indexOf(usersFromGroup[j].userId) === -1) {
                        users.push(usersFromGroup[j].userId);
                    }
                }
            }
            return users;
        });
    };
    this.getTaskUsersIdsByProduct = function (productId) {
        var self = this;
        return co(function* () {
            var userIds = [];
            var taskUserIds = [];
            var query = 'SELECT DISTINCT' +
                '"Tasks"."id" as "taskId", ' +
                '"Users"."id" as "userId" ' +
                'FROM "Tasks" ' +
                'INNER JOIN "UserGroups" ON ("Tasks"."groupIds" @> ARRAY["UserGroups"."groupId"]) ' +
                'INNER JOIN "Users" ON ("UserGroups"."userId" = "Users"."id") ' +
                'INNER JOIN "Products" ON ("Products"."id" = "Tasks"."productId") ' +
                pgEscape('WHERE ("Products"."id" = %s) ', productId) +
                'UNION ' +
                'SELECT DISTINCT' +
                '"Tasks"."id" as "taskId", ' +
                '"Users"."id" as "userId" ' +
                'FROM "Tasks" ' +
                'INNER JOIN "Users" ON ("Tasks"."userIds" @> ARRAY["Users"."id"]) ' +
                'INNER JOIN "Products" ON ("Products"."id" = "Tasks"."productId") ' +
                pgEscape('WHERE ("Products"."id" = %s) ', productId);
            var taskUsers = yield thunkQuery(query);
            if (_.first(taskUsers)) {
                _.each(taskUsers, function(item){
                    taskUserIds.push({
                        taskId: item.taskId,
                        userId: item.userId
                    });
                    if (userIds.indexOf(item.userId) === -1) {
                        userIds.push(item.userId);
                    }
                });
            }
            return {
                taskUserIds: taskUserIds,
                userIds: userIds
            };
        });
    };
    this.taskStatus = {
        flaggedColumn : function (commentDiscussion) {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                pgEscape('"%s"."id" ', commentDiscussion) +
                pgEscape('FROM "%s" ', commentDiscussion) +
                pgEscape('WHERE "%s"."isReturn" = true ', commentDiscussion) +
                pgEscape('AND "%s"."isResolve" = false ', commentDiscussion) +
                pgEscape('AND "%s"."activated" = true ', commentDiscussion) +
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : pgEscape('AND "%s"."taskId" = "Tasks"."id" ', commentDiscussion)) +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "flagged"';
        },
        flaggedCountColumn : function (commentDiscussion) {
            return '( ' +
                pgEscape('SELECT count("%s"."id") ', commentDiscussion) +
                pgEscape('FROM "%s" ', commentDiscussion) +
                pgEscape('WHERE "%s"."isReturn" = true ', commentDiscussion) +
                pgEscape('AND "%s"."isResolve" = false ', commentDiscussion) +
                pgEscape('AND "%s"."activated" = true ', commentDiscussion) +
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : pgEscape('AND "%s"."taskId" = "Tasks"."id" ', commentDiscussion)) +
                ') as "flaggedCount"';
        },
        flaggedFromColumn : function (commentDiscussion) {
            return '(' +
                'SELECT ' +
                pgEscape('"%s"."taskId" ', commentDiscussion) +
                pgEscape('FROM "%s" ', commentDiscussion) +
                pgEscape('WHERE "%s"."isReturn" = true ', commentDiscussion) +
                pgEscape('AND "%s"."isResolve" = false ', commentDiscussion) +
                pgEscape('AND "%s"."activated" = true ', commentDiscussion) +
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : pgEscape('AND "%s"."taskId" = "Tasks"."id" ', commentDiscussion)) +
                'LIMIT 1' +
                ') as "flaggedFrom"';
        },
        statusColumn : function (curStepAlias) {
            return 'CASE ' +
                'WHEN ' +
                '("' + curStepAlias + '"."position" > "WorkflowSteps"."position") ' +
                'OR ("ProductUOA"."isComplete" = TRUE) ' +
                'THEN \'completed\' ' +
                'WHEN (' +
                '"' + curStepAlias + '"."position" IS NULL ' +
                'AND ("WorkflowSteps"."position" = 0) ' +
                'AND ("Products"."status" = 1)' +
                ')' +
                'OR (' +
                '"' + curStepAlias + '"."position" = "WorkflowSteps"."position" ' +
                'AND ("Products"."status" = 1)' +
                ')' +
                'THEN \'current\' ' +
                'ELSE \'waiting\'' +
                'END as "status" ';
        }
    };
};
module.exports = exportObject;
