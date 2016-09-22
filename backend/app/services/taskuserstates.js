var
    _ = require('underscore'),
    common = require('app/services/common'),
    sComment = require('app/services/comments'),
    sSurvey = require('app/services/surveys'),
    TaskUserState = require('app/models/taskuserstates'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_taskuserstates_service');
var error = require('debug')('error');
debug.log = console.log.bind(console);




var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }
    var oComment = new sComment(req);
    var oSurvey = new sSurvey(req);

    this.add = function (taskId, users, endDate, version) {
        var self = this;
    // only initial adding task user states - when task created. Does not check existing records
        return co(function* () {
            var version = version ? version : yield oSurvey.getMaxSurveyVersion(taskId);
            var late = endDate ? (endDate < new Date()): false;
            var stateId = late ? TaskUserState.getStateId('late') : TaskUserState.getStateId('pending');
            var query ='INSERT INTO "TaskUserStates"  ("taskId", "userId", "stateId", "late", "endDate", "surveyVersion") ' +
                pgEscape('SELECT %s, v, %s, %s, %L, %s FROM unnest(\'{%s}\'::int[]) g(v)', taskId, stateId, late, endDate.toLocaleString(), version, users) +
                'RETURNING "TaskUserStates"."taskId", "TaskUserStates"."userId", "TaskUserStates"."stateId"';

            var result = yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Add initial states for taskId `' + taskId
            });
        });
    };
    this.update = function (taskId, users, endDate, version) {
        var self = this;
        // updating task user states.
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var late = (endDate < new Date());
            var stateId = late ? TaskUserState.getStateId('late') : TaskUserState.getStateId('pending');
            var query = TaskUserState
                .update({
                    stateId: stateId,
                    late: late,
                    endDate: endDate,
                    updatedAt: new Date()
                })
                .where(TaskUserState.userId.in(Array.from(users)))
                .and(TaskUserState.taskId.equals(taskId))
                .and(TaskUserState.surveyVersion.equals(version))
                .returning(TaskUserState.taskId, TaskUserState.userId, TaskUserState.stateId);
            var result = yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Update initial states for taskId `' + taskId
            });
        });
    };
    this.remove = function (taskId, users, version) {
        var self = this;
        // removing task user states.
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var query = TaskUserState
                .delete()
                .where(TaskUserState.taskId.equals(taskId)
                .and(TaskUserState.surveyVersion.equals(version))
            );
            if (users) { // if users specified - remove only states for specified users
                query = query.and(TaskUserState.userId.in(Array.from(users)));
            } // else remove all user states for specified task
            query = query.returning(TaskUserState.taskId, TaskUserState.userId, TaskUserState.stateId);

            var result = yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Delete initial states for taskId `' + taskId
            });
        });
    };
    this.modify = function (taskId, users, endDate, version) {
        // Modifying task user states.
        // if exist  - update
        // if not exist - add
        // if exist and not present in new users list for task - remove
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var newUsers = users;
            var removingUsers = users;
            var updatingUsers = users;
            // get existing taskUserStates - all users for specified task
            var query = TaskUserState
                .select(TaskUserState.userId)
                .where(TaskUserState.taskId.equals(taskId)
                .and(TaskUserState.surveyVersion.equals(version))
            );
            var existingUsers = yield thunkQuery(query);
            if (_.first(existingUsers)) {
                existingUsers = _.each(existingUsers, function(item, i, arr) {
                    arr[i] = item.userId;
                });
            }
            newUsers = _.difference(users, existingUsers);
            if (newUsers && newUsers.length > 0) {
                yield self.add(taskId, newUsers, endDate, version);

            }
            updatingUsers = _.intersection(users, existingUsers);
            if (updatingUsers && updatingUsers.length > 0) {
                yield self.updateEndDate(taskId, updatingUsers, endDate, version);
            }
            removingUsers = _.difference(existingUsers, users);
            if (removingUsers && removingUsers.length > 0) {
                yield self.remove(taskId, removingUsers, version);
            }
        });
    };
    this.upsert = function (taskId, userId, endDate, version) {
        // Upserting task user states.
        // if exist  - update
        // if not exist - add
        // Don't remove !!!
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var user = yield self.get(taskId, userId, version, true);
            if (user) {
                yield self.update(taskId, [userId], endDate, version);
            } else {
                yield self.add(taskId, [userId], endDate, version);
            }
            return user;
        });
    };
    this.get = function (taskId, userId, version, noCheckError) {
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            // get taskUserState
            var taskUserState = yield thunkQuery(TaskUserState
                    .select(TaskUserState.star())
                    .where(TaskUserState.taskId.equals(taskId))
                    .and(TaskUserState.userId.equals(userId))
                    .and(TaskUserState.surveyVersion.equals(version))
            );
            if (!_.first(taskUserState) && !noCheckError) {
                // backend server logic error - it does not possible
                //throw new HttpError(403, 'Server error: Not found taskUserState for taskId `'+taskId+'` userId `'+userId+'` - something wrong when assigning task to users and groups!');
                throw new HttpError(403, 'Obsolete project: Recreate (reassign)) all tasks!');
            }
            return _.first(taskUserState) ? taskUserState[0] : null;
        });
    };
    this.getByLists = function (tasks, users) {
        var self = this;
        return co(function* () {
            // get taskUserState(s)
            var query = TaskUserState
                    .select(TaskUserState.star(),
                    self.column.maxSurveyVersion()
                )
                    .where(TaskUserState.taskId.in(Array.from(tasks)))
                ;
            if (users) {
                query = query
                    .and(TaskUserState.userId.in(Array.from(users)));
            }
            var taskUserStates = yield thunkQuery(query);
            if (_.first(taskUserStates)) {
                taskUserStates = _.filter(taskUserStates, function(item){
                    return (item.maxSurveyVersion === item.surveyVersion);
                });
            }
            return taskUserStates;
        });
    };
    this.updateLate = function (tasks, users, version) {
        // update taskUserStates stateId - ONLY late state - hardcoded :( ToDo something
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(tasks[0]);
            var query ='UPDATE "TaskUserStates" ' +
                'SET ' +
                '"late" = ("endDate" < now()), ' +
                '"stateId" = ' +
                'CAST(CASE WHEN ("endDate" < now() AND ("stateId" = 0 OR "stateId" = 2)) ' +
                'THEN 1 ELSE "stateId" END as int), ' +
                '"updatedAt" = now() ' +
                pgEscape('WHERE (("TaskUserStates"."userId" IN (%s)) ', users) +
                pgEscape('AND ("TaskUserStates"."surveyVersion" = %s)) ', version)  +
                (tasks ? pgEscape('AND ("TaskUserStates"."taskId" IN (%s))) ', tasks) : ')') +
                'RETURNING "taskId", "userId", "stateId"';
            var result = yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Update states when Date increased'
            });
        });
    };
    this.updateState = function (taskId, userId, updateBody, version) {
        // update taskUserState stateId and flags if needed
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            updateBody = _.extend(updateBody, {updatedAt: new Date()});
            var result = yield thunkQuery(TaskUserState
                    .update(updateBody)
                    .where(TaskUserState.userId.equals(userId))
                    .and(TaskUserState.taskId.equals(taskId))
                    .and(TaskUserState.surveyVersion.equals(version))
                    .returning(TaskUserState.taskId, TaskUserState.userId, TaskUserState.stateId)
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Update taskId `' + taskId + '` for userId `' + userId +'`  stateId = `'+ result[0].stateId +'` now'
            });
        });
    };
    this.updateStateAt = function (taskId, userId, stateAtName, version) {
        // set taskUserState flag `stateAtName` (`startedAt`, `approvedAt`, `draftAt`) and then modify stateId
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var taskUserState = yield self.get(taskId, userId, version); // get taskUserState
            taskUserState[stateAtName] = new Date();
            taskUserState.stateId = TaskUserState.setState(taskUserState);
            yield self.updateState(taskId, userId, _.pick(taskUserState, ['stateId', stateAtName]), version);
        });
    };
    this.start = function (taskId, userId) {
        // set taskUserState flag `startedAt` and then modify stateId
        var self = this;
        return co(function* () {
            yield self.updateStateAt(taskId, userId, 'startedAt');
        });
    };
    this.approve = function (taskId, userId) {
        // set taskUserState flag `approvedAt` and then modify stateId
        var self = this;
        return co(function* () {
            yield self.updateStateAt(taskId, userId, 'approvedAt');
        });
    };
    this.draft = function (taskId, userId) {
        // set taskUserState flag `draftAt` and then modify stateId
        var self = this;
        return co(function* () {
            yield self.updateStateAt(taskId, userId, 'draftAt');
        });
    };
    this.updateEndDate = function (taskId, users, endDate, version) {
        // set taskUserState flag `late` when endDate changed and then set stateId
        var self = this;
        var taskUserState;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var late = (endDate < new Date());
            for (var i in users) {
                taskUserState = yield self.get(taskId, users[i], version); // get taskUserState
                taskUserState.late = late;
                taskUserState.endDate = endDate;
                taskUserState.stateId = TaskUserState.setState(taskUserState);
                yield self.updateState(taskId, users[i], _.pick(taskUserState, ['stateId', 'late', 'endDate']), version);
            }
        });
    };
    this.flagged = function (taskId, userId, unflag, version) {
        // set taskUserState flag `flagged` and then modify stateId
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var taskUserState = yield self.get(taskId, userId, version); // get taskUserState
            taskUserState.flagged = unflag ? false : true;
            taskUserState.stateId = TaskUserState.setState(taskUserState);
            yield self.updateState(taskId, userId, _.pick(taskUserState, ['stateId', 'flagged']), version);
        });
    };
    this.tryUnflag = function (taskId, userId, version) {
        // check if task for user haven`t unresolved flags - unflag it
        var self = this;
        return co(function* () {
            var version = version ? version : yield self.getMaxSurveyVersion(taskId);
            var isFlagged = yield oComment.isFlagged(taskId, userId);
            if (!isFlagged) {
                yield self.flagged(taskId, userId, !isFlagged, version);
            }
        });
    };

    this.getMaxSurveyVersion = function (taskId) {
        var self = this;
        return co(function* () {
            var query = TaskUserState
                .select(sql.functions.MAX(TaskUserState.surveyVersion))
                .from(
                TaskUserState
            )
                .where(TaskUserState.taskId.equals(taskId)
            );
            var result = yield thunkQuery(query);
            return _.first(result) ? result[0].max : 0;
        });
    };

    this.column = {
        maxSurveyVersion : function () {
            return '( ' +
                'SELECT max("TUS"."surveyVersion") ' +
                'FROM "TaskUserStates" as "TUS" ' +
                'WHERE "TaskUserStates"."taskId" = "TUS"."taskId" ' +
                //'AND "TaskUserStates"."userId" = "TUS"."userId"' +
                'GROUP BY "TUS"."taskId" ' +
                ') as "maxSurveyVersion"';
        //( SELECT max("TUS"."surveyVersion") FROM "TaskUserStates" as "TUS"  WHERE "TaskUserStates"."taskId" = "TUS"."taskId" AND "TaskUserStates"."userId" = "TUS"."userId" GROUP BY "TUS"."taskId" ) as "maxSurveyVersion"
        }
    };
    this.draftToVersion = function (tasks, version) {
        var self = this;
        // change draft task user states to version for specified tasks
        return co(function* () {
            var query = TaskUserState
                .update({
                    surveyVersion: version,
                    updatedAt: new Date()
                })
                .where(TaskUserState.taskId.in(Array.from(tasks)))
                .and(TaskUserState.surveyVersion.equals(-1))
                .returning(TaskUserState.taskId, TaskUserState.userId, TaskUserState.stateId);
            var result = yield thunkQuery(query);
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'TaskUserStates',
                entities: result,
                quantity: result.length,
                info: 'Change taskUserStates from draft to version for specified tasks'
            });
        });
    };
};
module.exports = exportObject;
