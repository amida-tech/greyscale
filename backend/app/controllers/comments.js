var
    _ = require('underscore'),
    auth = require('app/auth'),
    config = require('config'),
    common = require('app/services/common'),
    sTask = require('app/services/tasks'),
    sTaskUserState = require('app/services/taskuserstates'),
    sComment = require('app/services/comments'),
    sSurvey = require('app/services/surveys'),
    BoLogger = require('app/bologger'),
    Organization = require('app/models/organizations'),
    bologger = new BoLogger(),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    Workflow = require('app/models/workflows'),
    EssenceRole = require('app/models/essence_roles'),
    WorkflowStep = require('app/models/workflow_steps'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Comment = require('app/models/comments'),
    Notification = require('app/models/notifications'),
    notifications = require('app/controllers/notifications'),
    User = require('app/models/users'),
    Group = require('app/models/groups'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_comments');
var error = require('debug')('error');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            var taskId = (!req.query.version) ? yield oComment.checkOneId(req.query.taskId, Task, 'id', 'taskId', 'Task') : req.query.taskId;
            if (!taskId) {
                // if task not specified then surveyId required
                yield oComment.checkOneId(req.query.surveyId, Survey, 'id', 'surveyId', 'Survey');
            }
            var oSurvey = new sSurvey(req);
            var surveyVersion = req.query.version ? parseInt(req.query.version) : yield oSurvey.getMaxSurveyVersion(taskId);
            var isAdmin = auth.checkAdmin(req.user);
            return oComment.getComments(req.query, taskId, req.user.id, isAdmin, surveyVersion);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectAnswers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            var commentId = yield oComment.checkOneId(req.params.commentId, Comment, 'id', 'commentId', 'Comment');
            var comment = yield oComment.getComment(commentId);
            var oSurvey = new sSurvey(req);
            var surveyVersion = req.query.version ? parseInt(req.query.version) : yield oSurvey.getMaxSurveyVersion(comment.taskId);
            var isAdmin = auth.checkAdmin(req.user);
            return oComment.getAnswerComments(req.query, commentId, req.user.id, isAdmin, surveyVersion);

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    getVersionTasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            if (!req.params.version) {
                throw new HttpError(403, 'Version must be specified');
            }
            yield oComment.checkOneId(req.query.surveyId, Survey, 'id', 'surveyId', 'Survey');
            return yield oComment.getVersionTasks(req.query.surveyId, req.params.version);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oTaskUserState = new sTaskUserState(req);
            var oComment = new sComment(req);
            var oSurvey = new sSurvey(req);
            var isReturn = req.body.isReturn;
            var isResolve = req.body.isResolve;
            yield oComment.checkInsert(req.body.questionId, req.body.taskId, req.body.isReturn, req.body.userId, req.body.entry);

            var task = yield * common.getTask(req, parseInt(req.body.taskId));
            req.body = _.extend(req.body, {
                stepFromId: task.stepId
            }); // add stepFromId from task (for future use)
            req.body = _.extend(req.body, {
                stepId: task.stepId
            }); // add stepId from task (don't use stepId from body - use stepId only for current task)

            // add from realmUserId instead of user id
            req.body = _.extend(req.body, {
                userFromId: req.user.realmUserId
            });

            var surveyVersion = yield oSurvey.getMaxSurveyVersion(task.id);
            req.body = _.extend(req.body, {
                surveyVersion: surveyVersion
            });
            // get next order for entry
            var nextOrder = yield oComment.getNextOrder(task, req.body.questionId, surveyVersion);
            req.body = _.extend(req.body, {
                order: nextOrder
            }); // add nextOrder (if order was presented in body replace it)

            // if comment`s entry is entry with "returning" (isReturn flag is true)
            if (req.body.isReturn) {
                req.body = _.extend(req.body, {
                    returnTaskId: task.id
                }); // add returnTaskId
            } else if (req.body.isResolve) {
                req.body = _.omit(req.body, 'isReturn'); // remove isReturn flag from body
            }

            if (!req.query.autosave) {
                req.body = _.extend(req.body, {
                    activated: true
                }); // ordinary entries is activated
            }
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range

            if (isResolve) {
                // get userId from flagged comment
                var flaggedComment = yield * common.getEntity(req, req.body.returnTaskId, Comment, 'id');   // returnTaskId is used as reference to flag comment id
                req.body = _.extend(req.body, {
                    userId: flaggedComment.userFromId
                });
            }

            req.body = _.pick(req.body, Comment.insertCols); // insert only columns that may be inserted
            var newComment = yield oComment.insertOne(req.body, req.user);

            if (isReturn) {
                // TaskUserStates - start task for user
                yield oTaskUserState.flagged(task.id, req.user.id);
            }

            if (isResolve) {
                // update return entries - resolve their
                yield oComment.updateReturnTask(req.body.returnTaskId);   // returnTaskId is used as reference to flag comment id
                yield oTaskUserState.tryUnflag(task.id, req.body.userId);
            }

            if (req.body.activated && !isResolve) {
                if (isReturn) {
                    var authorId = yield * common.getPolicyAuthorIdByTask(req, task.id);
                    oComment.notify(newComment[0].id, task.id, 'Flagged comment added', 'Comments', 'comment', authorId);
                } else {
                    oComment.notify(newComment[0].id, task.id, 'Comment added', 'Comments', 'comment');
                }
            }

            return _.first(newComment);

        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    insertAnswer: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            var oSurvey = new sSurvey(req);
            yield oComment.checkAnswerInsert(req.params.commentId, req.body.isAgree, req.body.entry);
            var parentComment = yield * common.getEntity(req, req.params.commentId, Comment, 'id');
            req.body = _.extend(req.body,_.pick(parentComment, Comment.answerFromParentCols)); // add key values from parent comment
            req.body = _.extend(req.body, {
                parentId: parentComment.id
            });
            req.body = _.extend(req.body, {
                userFromId: req.user.realmUserId
            }); // add from realmUserId instead of user id
            if (!req.query.autosave) { // if autosave is exist for answers
                req.body = _.extend(req.body, {
                    activated: true
                }); // answers is activated
            }
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range
            // get next order for entry
            var surveyVersion = yield oSurvey.getMaxSurveyVersion(parentComment.taskId);
            yield oComment.checkDuplicateAnswer(parentComment.id, parentComment.taskId, req.user.id, surveyVersion);
            var nextOrder = yield oComment.getNextAnswerOrder(parentComment.id, surveyVersion);
            req.body = _.extend(req.body, {
                order: nextOrder
            }); // add nextOrder (if order was presented in body replace it)

            req.body = _.pick(req.body, Comment.insertCols); // insert only columns that may be inserted
            var newAnswerComment = yield oComment.insertOne(req.body, req.user);

            if (req.body.activated) {
                oComment.notify(newAnswerComment[0].id, parentComment.taskId, 'Answer added', 'Comments', 'comment');
            }

            return _.first(newAnswerComment);

        }).then(function (data) {
            res.status(201).json(data);
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            var isAdmin = auth.checkAdmin(req.user);
            yield oComment.checkUpdate(req.params.id, req.body.entry, req.user.id, isAdmin);
            req.body = _.extend(req.body, {
                updated: new Date()
            }); // update `updated`
            req.body = _.extend(req.body, {
                tags: JSON.stringify(req.body.tags)
            }); // stringify tags
            req.body = _.extend(req.body, {
                range: JSON.stringify(req.body.range)
            }); // stringify range
            req.body = _.pick(req.body, Comment.updateCols); // update only columns that may be updated
            var updateComment = yield oComment.updateOne(req.params.id, req.body, req.user);

            if (!updateComment[0].isResolve) {
                if (updateComment[0].isReturn) {
                    var authorId = yield * common.getPolicyAuthorIdByTask(req, updateComment[0].taskId);
                    oComment.notify(updateComment[0].id, updateComment[0].taskId, 'Flagged comment updated', 'Comments', 'comment', authorId);
                } else {
                    oComment.notify(updateComment[0].id, updateComment[0].taskId, 'Comment updated', 'Comments', 'comment');
                }
            }

            return updateComment;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oComment = new sComment(req);
            var isAdmin = auth.checkAdmin(req.user);
            var entry = yield oComment.checkCanUpdate(req.params.id, req.user.id, isAdmin);
            req.body.entry = entry.entry;
            oComment.notify(entry.id, entry.taskId, 'Comment deleted', null, 'comment');

            yield oComment.deleteOne(req.params.id, req.user);
        }).then(function () {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    getUsers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oTask = new sTask(req);
            var oComment = new sComment(req);
            var taskId = yield oComment.checkOneId(req.params.taskId, Task, 'id', 'taskId', 'Task');
            var usersAndGroups =  yield oTask.getUsersAndGroups(taskId);
            return {
                users: usersAndGroups.users,
                groups: usersAndGroups.groups,
                commentTypes: Comment.commentTypes
            };
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    getVersionUsers: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var oTask = new sTask(req);
            var oComment = new sComment(req);
            if (!req.params.version) {
                throw new HttpError(403, 'Version must be specified');
            }
            yield oComment.checkOneId(req.query.surveyId, Survey, 'id', 'surveyId', 'Survey');
            var tasks = yield oComment.getVersionTasks(req.query.surveyId, req.params.version);
            return  yield oTask.getUsersFromTasks(tasks);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },


    hideUnhide: function (req, res, next) {
        // put /comments/hidden?taskId=<id>&hide=true|false&filter='all'|'flagged'|<id>
        var thunkQuery = req.thunkQuery;
        co(function* () {
            // parse query
            var hide = req.query.hide ? (req.query.hide !== 'false') : true;
            var isAdmin = auth.checkAdmin(req.user);
            var oComment = new sComment(req);
            var taskId = yield oComment.checkOneId(req.query.taskId, Task, 'id', 'taskId', 'Task');

            var oSurvey = new sSurvey(req);
            var surveyVersion = yield oSurvey.getMaxSurveyVersion(taskId);

            yield oComment.hideUnhide(hide, req.user, isAdmin, taskId, req.query.filter, surveyVersion);

        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    }

};
