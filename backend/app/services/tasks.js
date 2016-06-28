var
    _ = require('underscore'),
    common = require('app/services/common'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    Product = require('app/models/products'),
    Group = require('app/models/groups'),
    WorkflowStep = require('app/models/workflow_steps'),
    ProductUOA = require('app/models/product_uoa'),
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

    getTaskUserStatuses : function (req, commentDiscussion, users, taskId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
                var userArraysAlias = 'userArrays';
                return yield thunkQuery('SELECT ' +
                    pgEscape('"%s"."userId", ', userArraysAlias) +
                    'CASE ' +
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
                    'END as "flagged" ' +
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

