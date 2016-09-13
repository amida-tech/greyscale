var
    _ = require('underscore'),
    common = require('app/services/common'),
    //sComment = require('app/services/comments'),
    //sSurvey = require('app/services/surveys'),
    //TaskUserState = require('app/models/taskuserstates'),
    Task = require('app/models/tasks'),
    WorkflowStep = require('app/models/workflow_steps'),
    WorkflowStepGroup = require('app/models/workflow_step_groups'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_workflows_service');
var error = require('debug')('error');
debug.log = console.log.bind(console);




var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }
    //var oComment = new sComment(req);
    //var oSurvey = new sSurvey(req);

    this.getSteps = function (workflowId) {
        var self = this;
        return co(function* () {
            var q = WorkflowStep
                .select(
                WorkflowStep.star(),
                self.column.usergroupId(),
                self.column.hasAssignedTasks()
            )
                .from(WorkflowStep)
                .where(WorkflowStep.workflowId.equals(workflowId));
            if (!req.query.order) {
                q = q.order(WorkflowStep.position);
            }
            return yield thunkQuery(q);
        });
    };

    this.getTaskByStep = function (workflowStepId, checkOnly) {
        var self = this;
        return co(function* () {
            var task = yield thunkQuery(Task.select().where(Task.stepId.equals(workflowStepId)));
            if (!_.first(task) && !checkOnly) {
                throw new HttpError(403, 'Task with stepId `' + workflowStepId + '` does not exist');
            }
            return _.first(task) ? task[0] : null;
        });
    };

    this.updateWorkflowStep = function (workflowStepId, updateObj, user) {
        var self = this;
        return co(function* () {
            yield thunkQuery(
                WorkflowStep
                    .update(updateObj)
                    .where(WorkflowStep.id.equals(workflowStepId))
            );
            bologger.log({
                req: req,
                user: user,
                action: 'update',
                object: 'workflowsteps',
                entity: workflowStepId,
                info: 'Update workflow step'
            });
        });
    };

    this.deleteWorkflowStep = function (workflowStepId, user) {
        var self = this;
        return co(function* () {
            yield thunkQuery(WorkflowStep.delete().where(WorkflowStep.id.equals(workflowStepId)));
            bologger.log({
                req: req,
                user: user,
                action: 'delete',
                object: 'workflowsteps',
                entity: workflowStepId,
                info: 'Delete workflow step'
            });
        });
    };

    this.deleteWorkflowStepGroups = function (workflowStepId, user) {
        var self = this;
        return co(function* () {
            yield thunkQuery(
                WorkflowStepGroup.delete().where(WorkflowStepGroup.stepId.equals(workflowStepId))
            );
            bologger.log({
                req: req,
                user: user,
                action: 'update',
                object: 'workflowstepgroups',
                info: 'Delete all workflow step groups for step ' + workflowStepId
            });
        });
    };

    this.insertWorkflowStep = function (insertObj, user) {
        var self = this;
        return co(function* () {
            var insertId = yield thunkQuery(WorkflowStep.insert(insertObj).returning(WorkflowStep.id));
            bologger.log({
                req: req,
                user: user,
                action: 'insert',
                object: 'workflowsteps',
                entity: insertId[0].id,
                info: 'Insert workflow step'
            });
            return insertId;
        });
    };

    this.insertWorkflowStepGroups = function (insertGroupObjs, user) {
        var self = this;
        return co(function* () {
            yield thunkQuery(WorkflowStepGroup.insert(insertGroupObjs));
            bologger.log({
                req: req,
                user: user,
                action: 'insert',
                object: 'workflowstepgroups',
                entities: insertGroupObjs,
                quantity: insertGroupObjs.length,
                info: 'Insert workflow step group(s)'
            });
        });
    };

    this.hasAssignedTasks = function (workflowStepId) {
        var self = this;
        return co(function* () {
            var q = WorkflowStep
                .select(
                self.column.hasAssignedTasks()
            )
                .from(WorkflowStep)
                .where(WorkflowStep.id.equals(workflowStepId));
            var step = yield thunkQuery(q);
            return (_.first(step)) ? step[0].hasAssignedTask : false;
        });
    };

    this.column = {
        hasAssignedTasks : function () {
            return '(' +
                'CASE ' +
                '   WHEN array_length(array(' +
                '       SELECT id ' +
                '       FROM "Tasks" ' +
                '       WHERE "stepId" = "WorkflowSteps".id ' +
                '       AND (' +
                '           ("userIds" IS NOT NULL AND array_length("userIds",1) > 0)' +
                '           OR ' +
                '           ("groupIds" IS NOT NULL AND array_length("groupIds",1) > 0)' +
                '       )' +
                '   ), 1) > 0' +
                '   THEN TRUE' +
                '   ELSE FALSE ' +
                'END' +
                ')  as "hasAssignedTasks"'
        },
        usergroupId : function () {
            return 'array(' +
                'SELECT "WorkflowStepGroups"."groupId" ' +
                'FROM "WorkflowStepGroups" ' +
                'WHERE "WorkflowStepGroups"."stepId" = "WorkflowSteps"."id"' +
                ') as "usergroupId"'
        }

    };
};
module.exports = exportObject;
