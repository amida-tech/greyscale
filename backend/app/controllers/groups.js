var _ = require('underscore'),
    Group = require('../models/groups'),
    UserGroup = require('../models/user_groups'),
    ProjectUserGroup = require('../models/project_user_groups'),
    Project = require('../models/projects'),
    WorkflowStepGroup = require('../models/workflow_step_groups'),
    HttpError = require('../error').HttpError,
    util = require('util'),
    async = require('async'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Query = require('../util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    common = require('../services/common'),
    thunkQuery = thunkify(query);

module.exports = {
    selectByOrg: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== parseInt(req.params.organizationId))) {
                throw new HttpError(400, 'You cannot view groups from other organizations');
            }
            var result = yield thunkQuery(
                Group.select(
                    Group.star(),
                    'array_agg("UserGroups"."userId") as "userIds"'
                )
                .from(
                    Group
                    .leftJoin(UserGroup)
                    .on(Group.id.equals(UserGroup.groupId))
                )
                .where(Group.organizationId.equals(req.params.organizationId))
                .group(Group.id)
            );
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== parseInt(req.params.organizationId))) {
                throw new HttpError(400, 'You cannot post groups to other organizations');
            }
            if (!req.body.title) {
                throw new HttpError(400, 'Title is required');
            }
            var objToInsert = {
                organizationId: req.params.organizationId,
                title: req.body.title
            };
            var groupResult = yield thunkQuery(Group.insert(objToInsert).returning(Group.id));
            var groupId = _.first(groupResult).id;
            if (req.body.users){
                var insertArr = _.map(req.body.users, (userId) => ({userId, groupId}));
                yield thunkQuery(UserGroup.insert(insertArr));
            }

            if (req.body.projectId) {
                yield thunkQuery(ProjectUserGroup.insert({projectId: req.body.projectId, groupId}));
                yield common.bumpProjectLastUpdated(req, req.body.projectId);
            }
            return groupResult;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'groups',
                entity: _.first(data).id,
                info: 'Add new group'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (req.user.roleID !== 1 && (req.user.organizationId !== req.body.organizationId)) {
                throw new HttpError(400, 'You cannot update groups from other organizations');
            }
            if (req.body.title) {
                var objToUpdate = {
                    title: req.body.title
                };
                yield thunkQuery(Group.update(objToUpdate).where(Group.id.equals(req.params.id)));

                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'groups',
                    entity: req.params.id,
                    info: 'Update group'
                });
            }

            if (req.body.userId) {
                var userGroups4delete = yield thunkQuery(
                    UserGroup.delete().where(UserGroup.groupId.equals(req.params.id)).returning('*')
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'delete',
                    object: 'userGroups',
                    entities: userGroups4delete,
                    quantity: userGroups4delete.length,
                    info: 'Delete group`s users'
                });
                var groupObjs = [];
                for (var i in req.body.userId) {
                    groupObjs.push({
                        groupId: req.params.id,
                        userId: req.body.userId[i],
                    });
                }
                if (groupObjs.length) {
                    yield thunkQuery(
                    UserGroup.insert(groupObjs)
                );
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'userGroups',
                        entities: groupObjs,
                        quantity: groupObjs.length,
                        info: 'Add new users for group'
                    });
                }

                yield bumpProjectLastUpdatedByGroup(req, req.params.id);
            }
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            // Check if the project is active
            const project = yield thunkQuery(
                Project.select(
                    Project.star()
                )
                .from(
                    Project
                        .leftJoin(ProjectUserGroup)
                        .on(ProjectUserGroup.projectId.equals(Project.id))
                )
                .where(ProjectUserGroup.groupId.equals(req.params.id))
            );

            if (!_.isEmpty(project) && parseInt(_.first(project).status) === 1) {
                throw new HttpError(400, 'Cannot delete group from an active project');
            } else {
                // Remove from workflowStepGroup in table in order not to violate the constraint
                yield thunkQuery(
                    WorkflowStepGroup.delete().where(WorkflowStepGroup.groupId.equals(req.params.id))
                );

                // Remove from project association.
                yield thunkQuery(
                    ProjectUserGroup.delete()
                        .where(ProjectUserGroup.projectId.equals(_.first(project).id)
                        .and(ProjectUserGroup.groupId.equals(req.params.id)))
                );

                // Remove users from group in UserGroup table in order not to violate the constraint
                yield thunkQuery(
                    UserGroup.delete().where(UserGroup.groupId.equals(req.params.id))
                );

                // Remove from group table
                yield thunkQuery(
                    Group.delete().where(Group.id.equals(req.params.id))
                );

                yield bumpProjectLastUpdatedByGroup(req, req.params.id);
            }
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'groups',
                entity: req.params.id,
                info: 'Delete group'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                Group.select().where(Group.id.equals(req.params.id))
            );
            if (!result[0]) {
                throw new HttpError(404, 'Not found');
            }
            return result[0];
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var groupsList = [];
        co(function* () {
            var groups = yield thunkQuery(
                Group.select(
                    Group.star(),
                    ProjectUserGroup.projectId,
                    Project.codeName)
                .from(
                    Group
                        .leftJoin(ProjectUserGroup)
                        .on(Group.id.equals(ProjectUserGroup.groupId))
                        .leftJoin(Project)
                        .on(Project.id.equals(ProjectUserGroup.projectId))
                ));

            if (!_.first(groups)) {
                return groupsList;
            }

            var searchIn = [];
            groups.map((group) => searchIn.push(group.id));

            var userGroups = yield thunkQuery(
                UserGroup.select(
                    UserGroup.groupId,
                    'array_agg("userId") as users',
                )
                .where(UserGroup.groupId.in(searchIn))
                .group(UserGroup.groupId));

            for (var i = 0; i < groups.length; i++) {
                var userGroup = _.find(userGroups, (userGroup) => userGroup.groupId === groups[i].id);
                groupsList.push({
                    id: groups[i].id,
                    title: groups[i].title,
                    organizationId: groups[i].organizationId,
                    langId: groups[i].langId,
                    projectName: groups[i].codeName,
                    users: userGroup.users,
                });
            }
            return groupsList;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }
};

function * bumpProjectLastUpdatedByGroup(req, groupId) {
    const projectUserGroupResult = yield req.thunkQuery(ProjectUserGroup
    .select(ProjectUserGroup.projectId)
    .where(ProjectUserGroup.groupId.equals(groupId)));

    if (projectUserGroupResult.length > 0) {
        yield common.bumpProjectLastUpdated(req, projectUserGroupResult[0].projectId);
    }
}
