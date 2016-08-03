var
    _ = require('underscore'),
    common = require('app/services/common'),
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
    this.add = function (taskId, users, endDate) {
    // only initial adding task user states - when task created. Does not check existing records
        return co(function* () {
            var late = endDate ? (endDate < new Date()): false;
            var stateId = late ? TaskUserState.getStateId('late') : TaskUserState.getStateId('pending');
            var query ='INSERT INTO "TaskUserStates"  ("taskId", "userId", "stateId", "late", "endDate") ' +
                pgEscape('SELECT %s, v, %s, %s, %L FROM unnest(\'{%s}\'::int[]) g(v)', taskId, stateId, late, endDate.toLocaleString(), users) +
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
    this.update = function (taskId, users, endDate) {
        // updating task user states.
        return co(function* () {
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
    this.remove = function (taskId, users) {
        // removing task user states.
        return co(function* () {
            var query = TaskUserState
                .delete()
                .where(TaskUserState.taskId.equals(taskId));
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
    this.modify = function (taskId, users, endDate) {
        // Modifying task user states.
        // if exist  - update
        // if not exist - add
        // if exist and not present in new users list for task - remove
        var self = this;
        return co(function* () {
            var newUsers = users;
            var removingUsers = users;
            var updatingUsers = users;
            // get existing taskUserStates - all users for specified task
            var query = TaskUserState
                .select(TaskUserState.userId)
                .where(TaskUserState.taskId.equals(taskId));
            var existingUsers = yield thunkQuery(query);
            if (_.first(existingUsers)) {
                existingUsers = _.each(existingUsers, function(item, i, arr) {
                    arr[i] = item.userId;
                });
            }
            newUsers = _.difference(users, existingUsers);
            if (newUsers && newUsers.length > 0) {
                yield self.add(taskId, newUsers, endDate);

            }
            updatingUsers = _.intersection(users, existingUsers);
            if (updatingUsers && updatingUsers.length > 0) {
                yield self.updateEndDate(taskId, updatingUsers, endDate);
            }
            removingUsers = _.difference(existingUsers, users);
            if (removingUsers && removingUsers.length > 0) {
                yield self.remove(taskId, removingUsers);
            }
        });
    };
    this.upsert = function (taskId, userId, endDate) {
        // Upserting task user states.
        // if exist  - update
        // if not exist - add
        // Don't remove !!!
        var self = this;
        return co(function* () {
            var user = yield self.get(taskId, userId, true);
            if (user) {
                yield self.update(taskId, [userId], endDate);
            } else {
                yield self.add(taskId, [userId], endDate);
            }
            return user;
        });
    };
    this.get = function (taskId, userId, noCheckError) {
        return co(function* () {
            // get taskUserState
            var taskUserState = yield thunkQuery(TaskUserState
                    .select(TaskUserState.star())
                    .where(TaskUserState.taskId.equals(taskId))
                    .and(TaskUserState.userId.equals(userId))
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
        return co(function* () {
            // get taskUserState(s)
            var query = TaskUserState
                    .select(TaskUserState.star());
            if (tasks && users) {
                query = query
                    .where(TaskUserState.userId.in(Array.from(users)))
                    .and(TaskUserState.taskId.in(Array.from(tasks)));
            } else if (users) {
                query = query
                    .where(TaskUserState.userId.in(Array.from(users)));
            } else if (tasks) {
                query = query
                    .where(TaskUserState.taskId.in(Array.from(tasks)));
            }
            return yield thunkQuery(query);
        });
    };
    this.updateLate = function (tasks, users) {
        // update taskUserStates stateId - ONLY late state - hardcoded :( ToDo something
        var self = this;
        return co(function* () {
            var query ='UPDATE "TaskUserStates" ' +
                'SET ' +
                '"late" = ("endDate" < now()), ' +
                '"stateId" = ' +
                'CAST(CASE WHEN ("endDate" < now() AND ("stateId" = 0 OR "stateId" = 2)) ' +
                'THEN 1 ELSE "stateId" END as int), ' +
                '"updatedAt" = now() ' +
                pgEscape('WHERE (("TaskUserStates"."userId" IN (%s)) ', users) +
                (tasks ? pgEscape('AND ("TaskUserStates"."taskId" IN (%s))) ', tasks) : ')') +
                'RETURNING "taskId", "userId", "stateId"';
/*
            var query = TaskUserState
                    .update(updateBody)
                    .where(TaskUserState.userId.in(Array.from(users)))
                    .and(TaskUserState.taskId.in(Array.from(tasks)))
                    .returning(TaskUserState.taskId, TaskUserState.userId, TaskUserState.stateId);
*/
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
    this.updateState = function (taskId, userId, updateBody) {
        // update taskUserState stateId and flags if needed
        var self = this;
        return co(function* () {
            updateBody = _.extend(updateBody, {updatedAt: new Date()});
            var result = yield thunkQuery(TaskUserState
                    .update(updateBody)
                    .where(TaskUserState.userId.equals(userId))
                    .and(TaskUserState.taskId.equals(taskId))
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
    this.updateStateAt = function (taskId, userId, stateAtName) {
        // set taskUserState flag `stateAtName` (`startedAt`, `approvedAt`, `draftAt`) and then modify stateId
        var self = this;
        return co(function* () {
            var taskUserState = yield self.get(taskId, userId); // get taskUserState
            taskUserState[stateAtName] = new Date();
            taskUserState.stateId = TaskUserState.setState(taskUserState);
            yield self.updateState(taskId, userId, _.pick(taskUserState, ['stateId', stateAtName]));
        });
    };
    this.start = function (taskId, userId) {
        // set taskUserState flag `startedAt` and then modify stateId
        this.updateStateAt(taskId, userId, 'startedAt');
    };
    this.approve = function (taskId, userId) {
        // set taskUserState flag `approvedAt` and then modify stateId
        this.updateStateAt(taskId, userId, 'approvedAt');
    };
    this.draft = function (taskId, userId) {
        // set taskUserState flag `draftAt` and then modify stateId
        this.updateStateAt(taskId, userId, 'draftAt');
    };
    this.updateEndDate = function (taskId, users, endDate) {
        // set taskUserState flag `late` when endDate changed and then set stateId
        var self = this;
        var taskUserState;
        return co(function* () {
            var late = (endDate < new Date());
            for (var i in users) {
                taskUserState = yield self.get(taskId, users[i]); // get taskUserState
                taskUserState.late = late;
                taskUserState.endDate = endDate;
                taskUserState.stateId = TaskUserState.setState(taskUserState);
                yield self.updateState(taskId, users[i], _.pick(taskUserState, ['stateId', 'late', 'endDate']));
            }
        });
    };
    this.flagged = function (taskId, userId) {
        // set taskUserState flag `flagged` and then modify stateId
        var self = this;
        return co(function* () {
            var taskUserState = yield self.get(taskId, userId); // get taskUserState
            taskUserState.flagged = true;
            taskUserState.stateId = TaskUserState.setState(taskUserState);
            yield self.updateState(taskId, userId, _.pick(taskUserState, ['stateId', 'flagged']));
        });
    };
};
module.exports = exportObject;
