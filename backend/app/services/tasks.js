var
    _ = require('underscore'),
    common = require('app/services/common'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    Product = require('app/models/products'),
    Group = require('app/models/groups'),
    WorkflowStep = require('app/models/workflow_steps'),
    ProductUOA = require('app/models/product_uoa'),
    UOA = require('app/models/uoas'),
    Project = require('app/models/projects'),
    co = require('co'),
    HttpError = require('app/error').HttpError,
    pgEscape = require('pg-escape');

var exportObject =  {
    getByProductUOA: function (req, productId, uoaId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
                return yield thunkQuery(
                    Task.select().where({
                        productId: productId,
                        uoaId: uoaId
                    })
                );
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    isPolicy: function (req, taskId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    isPolicyProduct: function (req, productId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getProductTasks : function (req) {
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var isPolicy = yield this.isPolicyProduct(req, req.params.id);
                if (isPolicy) {
                    //var usersIds =  yield this.getUsersIds(req, req.params.id);
                    var tasks = yield this.getProductTasksExt(req, 'Comments');
                    return tasks;
                } else {
                    return yield this.getProductTasksExt(req, 'Discussions');
                }
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getProductTasksExt : function (req, commentDiscussion) {
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var thunkQuery = req.thunkQuery;
                var curStepAlias = 'curStep';
                return yield thunkQuery(
                    Task
                        .select(
                        Task.star(),
                        this.taskStatus.flaggedColumn(commentDiscussion),
                        this.taskStatus.flaggedCountColumn(commentDiscussion),
                        this.taskStatus.flaggedFromColumn(commentDiscussion),
                        this.taskStatus.statusColumn(curStepAlias),
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getSelfTasks : function (req) {
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var surveyTasks = yield this.getSelfTasksExt(req, 'Discussions', 'curStep');
                var policyTasks = yield this.getSelfTasksExt(req, 'Comments', 'curStep', true);
                var tasksUserStatus = yield this.getTasksUserStatus(req, 'Comments', req.user.id);
                policyTasks = this.mergeTasksWithUserStatus(policyTasks, tasksUserStatus, 'userStatus');
                return _.union(surveyTasks, policyTasks);
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getSelfTasksExt : function (req, commentDiscussion, curStepAlias, isPolicy) {
        var thunkQuery = req.thunkQuery;
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
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
                    this.taskStatus.flaggedColumn(commentDiscussion),
                    this.taskStatus.flaggedCountColumn(commentDiscussion),
                    this.taskStatus.flaggedFromColumn(commentDiscussion),
                    this.taskStatus.statusColumn(curStepAlias)
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
                        Task.userIds.contains('{' + req.user.id + '}')
                            .and(Product.status.equals(1))
                            .and(Survey.policyId.isNotNull())
                    );
                } else {
                    query = query.where(
                        Task.userIds.contains('{' + req.user.id + '}')
                            .and(Product.status.equals(1))
                            .and(Survey.policyId.isNull())
                    );
                }
                return yield thunkQuery(query, req.query);
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getTaskExt : function (req, commentDiscussion, curStepAlias) {
        var thunkQuery = req.thunkQuery;
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var taskExt = yield thunkQuery(
                    Task
                        .select(
                        Task.star(),
                        this.taskStatus.flaggedColumn(commentDiscussion),
                        this.taskStatus.flaggedCountColumn(commentDiscussion),
                        this.taskStatus.flaggedFromColumn(commentDiscussion),
                        this.taskStatus.statusColumn(curStepAlias)
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getTaskSurvey : function (req) {
        return this.getTaskExt(req, 'Discussions', 'curStep');
    },
    getTaskPolicy : function (req) {
        return this.getTaskExt(req, 'Comments', 'curStep');
    },
    getTaskUsersStatuses : function (req, commentDiscussion, users, taskId) {
        var thunkQuery = req.thunkQuery;
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var userArraysAlias = 'userArrays';
                return yield thunkQuery('SELECT ' +
                    pgEscape('"%s"."userId", ', userArraysAlias) +
                    this.taskUserStatus.flaggedColumn(commentDiscussion, userArraysAlias) + ', ' +
                    this.taskUserStatus.approvedColumn('SurveyAnswers', userArraysAlias) + ', ' +
                    this.taskUserStatus.lateColumn('WorkflowSteps') + ', ' +
                    this.taskUserStatus.draftColumn('SurveyAnswers', userArraysAlias) +
                    'FROM "Tasks", ' +
                    pgEscape('(SELECT unnest(\'{%s}\'::int[]) as "userId") as "%s" ', users, userArraysAlias) +
                    pgEscape('WHERE ("Tasks"."id" = %s) ', taskId)
                );
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getTasksUserStatus : function (req, commentDiscussion, userId) {
        var thunkQuery = req.thunkQuery;
        var that = this;
        return new Promise((resolve, reject) => {
            co.call(that, function* () {
                var userAlias = 'userAlias';
                return yield thunkQuery('SELECT ' +
                    '"Tasks"."id" as "id", ' +
                    pgEscape('"%s"."userId", ', userAlias) +
                    this.taskUserStatus.flaggedColumn(commentDiscussion, userAlias) + ', ' +
                    this.taskUserStatus.approvedColumn('SurveyAnswers', userAlias) + ', ' +
                    this.taskUserStatus.lateColumn('WorkflowSteps') + ', ' +
                    this.taskUserStatus.draftColumn('SurveyAnswers', userAlias) +
                    'FROM "Tasks" ' +
                    'INNER JOIN "Products" ON ("Tasks"."productId" = "Products"."id") ' +
                    'INNER JOIN "Surveys" ON ("Products"."surveyId" = "Surveys"."id"), ' +
                    pgEscape('(SELECT %s as "userId") as "%s" ', userId, userAlias) +
                    pgEscape('WHERE ("Tasks"."userIds" @> \'{%s}\') ', userId) +
                    'AND ("Products"."status" = 1) ' +
                    'AND ("Surveys"."policyId" IS NOT NULL)'
                );
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    taskUserStatus : {
        flaggedColumn : function (commentDiscussion, userArraysAlias) {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                pgEscape('"%s"."userFromId" ', commentDiscussion) +
                pgEscape('FROM "%s" ', commentDiscussion) +
                pgEscape('WHERE "%s"."isReturn" = true ', commentDiscussion) +
                pgEscape('AND "%s"."isResolve" = false ', commentDiscussion) +
                pgEscape('AND "%s"."activated" = true ', commentDiscussion) +
                pgEscape('AND "%s"."userFromId" = "%s"."userId" ', commentDiscussion, userArraysAlias) +
                pgEscape('AND "Tasks"."id" = "%s"."taskId" ', commentDiscussion) +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "flagged" ';
        },
        approvedColumn : function (surveyAnswer, userArraysAlias) {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                pgEscape('"%s"."userId" ', surveyAnswer) +
                pgEscape('FROM "%s" ', surveyAnswer) +
                pgEscape('WHERE "%s"."version" IS NOT NULL ', surveyAnswer) +
                pgEscape('AND "%s"."productId" = "Tasks"."productId" ', surveyAnswer) +
                pgEscape('AND "%s"."UOAid" = "Tasks"."uoaId" ', surveyAnswer) +
                pgEscape('AND "%s"."userId" = "%s"."userId" ', surveyAnswer, userArraysAlias) +
                pgEscape('AND "%s"."wfStepId" = "Tasks"."stepId" ', surveyAnswer) +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "approved" ';
        },
        lateColumn : function (wfSteps) {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                pgEscape('"%s"."id" ', wfSteps) +
                pgEscape('FROM "%s" ', wfSteps) +
                pgEscape('WHERE "%s"."endDate" < now() ', wfSteps) +
                pgEscape('AND "%s"."id" = "Tasks"."stepId" ', wfSteps) +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "late" ';
        },
        draftColumn : function (surveyAnswer, userArraysAlias) {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                pgEscape('"%s"."userId" ', surveyAnswer) +
                pgEscape('FROM "%s" ', surveyAnswer) +
                pgEscape('WHERE "%s"."productId" = "Tasks"."productId" ', surveyAnswer) +
                pgEscape('AND "%s"."UOAid" = "Tasks"."uoaId" ', surveyAnswer) +
                pgEscape('AND "%s"."userId" = "%s"."userId" ', surveyAnswer, userArraysAlias) +
                pgEscape('AND "%s"."wfStepId" = "Tasks"."stepId" ', surveyAnswer) +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "draft" ';
        }
    },
    getNamedStatuses: function (detailStatuses, status) {
        return _.each(detailStatuses, function(item, i, arr){
            item = this.getNamedItemStatus(item, status);
        }, this);
    },
    getNamedItemStatus: function (item, status) {
        if (item.flagged) {
            item[status] = 'flagged';
        } else if (item.approved) {
            item[status] = 'approved';
        } else if (item.late) {
            item[status] = 'late';
        } else if (item.draft) {
            item[status] = 'started';
        } else {
            item[status] = 'pending';
        }
        delete item.flagged;
        delete item.approved;
        delete item.late;
        delete item.draft;
        return item;
    },
    mergeTasksWithUserStatus: function (tasks, statuses, statusName) {
        tasks = _.each(tasks, function(item, i, arr){
            for (var i in statuses) {
                if (statuses.indexOf(item.id) === -1) {
                    statuses[i] = this.getNamedItemStatus(statuses[i], statusName);
                    item[statusName] = statuses[i][statusName];
                }
            }
        }, this);
        return tasks;
    },
    taskStatus : {
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
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : '') +
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
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : '') +
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
                ((commentDiscussion === 'Discussions') ? pgEscape('AND "%s"."returnTaskId" = "Tasks"."id" ', commentDiscussion) : '') +
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
    },
    getUsersAndGroups : function (req, taskId) {
        return new Promise((resolve, reject) => {
            co(function* () {
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    getUsersIds : function (req, taskId) {
        return new Promise((resolve, reject) => {
            co(function* () {
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
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    }
};
module.exports = exportObject;

