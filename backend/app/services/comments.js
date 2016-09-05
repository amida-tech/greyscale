var
    _ = require('underscore'),
    common = require('app/services/common'),
    Comment = require('app/models/comments'),
    Survey = require('app/models/surveys'),
    SurveyMeta = require('app/models/survey_meta'),
    SurveyQuestion = require('app/models/survey_questions'),
    Task = require('app/models/tasks'),
    WorkflowStep = require('app/models/workflow_steps'),
    User = require('app/models/users'),
    notifications = require('app/controllers/notifications'),   // ToDo: move to notification service when refactored
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_comments_service');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }
    this.isFlagged = function (taskId, userId) {
        var self = this;
        return co(function* () {
            var query = Comment
                .select(Comment.id)
                .where(Comment.userFromId.equals(userId)
                    .and(Comment.taskId.equals(taskId))
                    .and(Comment.isReturn.equals(true))
                    .and(Comment.isResolve.equals(false))
                    .and(Comment.activated.equals(true))
            );
            var result = yield thunkQuery(query);
            return _.first(result);
        });
    };

    this.getComment = function (commentId) {
        var self = this;
        return co(function* () {
            var query = Comment
                .select(
                Comment.star(),
                self.answers.agree(),
                self.answers.disagree()
            )
                .from(Comment
            )
                .where(Comment.id.equals(commentId)
            );

            var result = yield thunkQuery(query);
            if (!_.first(result)) {
                throw new HttpError(403, 'Comment with id `' + parseInt(commentId).toString() + '` does not exist in comments');
            }
            return result[0];
        });
    };

    this.getComments = function (reqQuery, taskId, userId, isAdmin, version) {
        var self = this;
        return co(function* () {
            var query = Comment
                .select(
                Comment.star(),
                self.answers.agree(),
                self.answers.disagree(),
                Task.uoaId,
                Task.productId,
                Survey.id.as('surveyId')
            )
                .from(Comment
                    .join(Task)
                    .on(Task.id.equals(Comment.taskId))
                    .join(WorkflowStep)
                    .on(WorkflowStep.id.equals(Task.stepId))
                    .leftJoin(SurveyMeta)
                    .on(SurveyMeta.productId.equals(Task.productId))
                    .leftJoin(Survey)
                    .on(Survey.id.equals(SurveyMeta.surveyId).and(Survey.surveyVersion.equals(version)))
                )
                .where(Comment.surveyVersion.equals(version)
            );
            if (taskId) {
                query = query.and(Comment.taskId.equals(taskId));
            }
            if (!reqQuery.answers) {
                query = query.and(Comment.parentId.isNull()); // select only comments - not answers
            }
            if (reqQuery.questionId) {
                query = query.and(Comment.questionId.equals(reqQuery.questionId));
            }
            if (reqQuery.stepId) {
                query = query.and(WorkflowStep.id.equals(reqQuery.stepId));
            }
            if (reqQuery.surveyId) {
                query = query.and(Survey.id.equals(reqQuery.surveyId));
            }
            //return only activated comments and draft comments for current user
            query = query.and(Comment.activated.equals(true).or(Comment.userFromId.equals(userId)));
            if (!(reqQuery.hidden === 'true')) {
                // show only unhidden comments
                query = query.and(Comment.isHidden.equals(false));
            } else if(!isAdmin) {
                // specified hidden parameters for ordinary user show only self comments (include hidden)
                query = query.and(Comment.isHidden.equals(false).or(Comment.userFromId.equals(userId)));
            } // if admin - show all hidden comments

            if (reqQuery.filter === 'resolve') {
                /*
                 it should filter results to get actual messages without history - returning flag messages and draft resolving messages
                 (isReturn && !isResolve && activated) || (isResolve && !isReturn && !activated)
                 */
                /*
                 ' AND (' +
                 '("Comments"."isReturn" = true AND "Comments"."isResolve" = false AND "Comments"."activated" = true) ' +
                 'OR ' +
                 '("Comments"."isReturn" = false AND "Comments"."isResolve" = true AND "Comments"."activated" = false) ' +
                 ') ';
                 */
                query = query.and(
                    Comment.isReturn.equals(Comment.activated).and(Comment.isResolve.notEquals(Comment.activated))
                );
            }

            if (reqQuery.order) {
                var sorted = req.query.order.split(',');
                for (var i = 0; i < sorted.length; i++) {
                    var sort = sorted[i];
                    if (sort.indexOf('-') === 0) {
                        query = query.order(Comment[sort.replace('-', '').trim()].descending)
                    } else {
                        query = query.order(Comment[sort.replace('-', '').trim()])
                    }
                }
            }

            return yield thunkQuery(query);
        });
    };

    this.getVersionTasks = function (surveyId, version) {
        var self = this;
        return co(function* () {
            var query = Task
                .select(
                Task.id.distinct(),
                Task.title,
                Task.description,
                Task.uoaId,
                Task.productId,
                Task.stepId,
                Task.startDate,
                Task.endDate,
                Task.userIds,
                Task.groupIds,
                WorkflowStep.workflowId,
                WorkflowStep.startDate.as('stepStartDate'),
                WorkflowStep.endDate.as('stepEndDate'),
                WorkflowStep.title.as('stepTitle'),
                WorkflowStep.role
            )
                .from(Task
                    .leftJoin(Comment)
                    .on(Task.id.equals(Comment.taskId))
                    .leftJoin(WorkflowStep)
                    .on(WorkflowStep.id.equals(Task.stepId))
                    .leftJoin(SurveyMeta)
                    .on(SurveyMeta.productId.equals(Task.productId))
                    .leftJoin(Survey)
                    .on(Survey.id.equals(SurveyMeta.surveyId).and(Survey.surveyVersion.equals(version)))
            )
                .where(Comment.surveyVersion.equals(version)
                .and(Survey.id.equals(surveyId))
            );

            return yield thunkQuery(query);
        });
    };

    this.getAnswerComments = function (reqQuery, commentId, userId, isAdmin, version) {
        var self = this;
        return co(function* () {

            var query = Comment
                .select(
                Comment.star()
            )
                .from(Comment
            )
                .where(Comment.parentId.equals(commentId) // select answers
                    .and(Comment.activated.equals(true).or(Comment.userFromId.equals(userId)))
                    .and(Comment.surveyVersion.equals(version))
            );
            if (!(reqQuery.hidden === 'true')) {
                // show only unhidden comments
                query = query.and(Comment.isHidden.equals(false));
            } else if(!isAdmin) {
                // specified hidden parameters for ordinary user show only self comments (include hidden)
                query = query.and(Comment.isHidden.equals(false).or(Comment.userFromId.equals(userId)));
            } // if admin - show all hidden comments

            if (reqQuery.order) {
                var sorted = req.query.order.split(',');
                for (var i = 0; i < sorted.length; i++) {
                    var sort = sorted[i];
                    if (sort.indexOf('-') === 0) {
                        query = query.order(Comment[sort.replace('-', '').trim()].descending)
                    } else {
                        query = query.order(Comment[sort.replace('-', '').trim()])
                    }
                }
            }

            return yield thunkQuery(query);

        });
    };

    this.checkInsert = function (questionId, taskId, isReturn, userId, entry) {
        var self = this;
        return co(function* () {
            yield self.checkOneId(questionId, SurveyQuestion, 'id', 'questionId', 'Question');
            yield self.checkOneId(taskId, Task, 'id', 'taskId', 'Task');
            if (isReturn) {
                yield self.checkOneId(userId, User, 'id', 'userId', 'User');
            }
            yield self.checkString(entry, 'Entry');
        });
    };

    this.checkAnswerInsert = function (commentId, isAgree,  entry) {
        var self = this;
        return co(function* () {
            yield self.checkOneId(commentId, Comment, 'id', 'commentId', 'Comment');
            if (!isAgree ) { // disagree
                yield self.checkString(entry, 'Entry');
            }
        });
    };

    this.checkDuplicateAnswer = function (parentCommentId, taskId,  userId, version) {
        var self = this;
        return co(function* () {
            var query =
                Comment
                    .select(Comment.id)
                    .from(Comment)
                    .where(
                    Comment.parentId.equals(parentCommentId)
                        .and(Comment.taskId.equals(taskId))
                        .and(Comment.userFromId.equals(userId))
                        .and(Comment.surveyVersion.equals(version))
                );
            var result = yield thunkQuery(query);
            if (_.first(result)) {
                throw new HttpError(403, 'User already agreed/disagreed with this comment');
            }
        });
    };

    this.insertOne = function (reqBody, reqUser) {
        return co(function* () {
            var result = yield thunkQuery(Comment.insert(reqBody).returning(Comment.id));

            bologger.log({
                req: req,
                user: reqUser,
                action: 'insert',
                object: 'Comments',
                entity: result[0].id,
                info: 'Add comment'
            });

            return result;
        });
    };

    this.checkUpdate = function (commentId, entry, userId, isAdmin) {
        var self = this;
        return co(function* () {
            yield self.checkCanUpdate(commentId, userId, isAdmin);
            yield self.checkString(entry, 'Entry');
        });
    };

    this.checkCanUpdate = function (commentId, userId, isAdmin, checkOnly) {
        var self = this;
        return co(function* () {
            /*
             Possible update ONLY self comment`s message (or admin)
             */
            var entry = yield self.getComment(commentId);
            if (!isAdmin && entry.userFromId !== userId) {
                if (checkOnly) {
                    return false;
                }
                throw new HttpError(403, 'Comment with id=`' + commentId + '` cannot be updated or deleted');
            }
            return entry;
        });
    };

    this.updateOne = function (commentId, reqBody, reqUser) {
        return co(function* () {
            var result = yield thunkQuery(Comment.update(reqBody).where(Comment.id.equals(commentId)).returning(Comment.id, Comment.taskId, Comment.isReturn, Comment.isResolve));

            bologger.log({
                req: req,
                user: reqUser,
                action: 'update',
                object: 'Comments',
                entity: result[0].id,
                info: 'Update body of comment'
            });
            return result;
        });
    };

    this.deleteOne = function (commentId, reqUser) {
        return co(function* () {
            yield thunkQuery(Comment.delete().where(Comment.id.equals(commentId)));
            bologger.log({
                req: req,
                user: reqUser,
                action: 'delete',
                object: 'Comments',
                entity: commentId,
                info: 'Delete comment'
            });
        });
    };

    this.getNextOrder = function (task, questionId, version) {
        var self = this;
        return co(function* () {
            var productId = task.productId;
            var uoaId = task.uoaId;
            var query =
                'SELECT ' +
                'max("Comments".order) as "maxOrder" ' +
                'FROM ' +
                '"Comments" ' +
                'INNER JOIN "Tasks" ON "Comments"."taskId" = "Tasks"."id" ' +
                'WHERE  ' +
                pgEscape('"Tasks"."uoaId" = %s', uoaId) +
                pgEscape(' AND "Tasks"."productId" = %s', productId) +
                pgEscape(' AND "Comments"."questionId" = %s ', questionId) +
                pgEscape(' AND "Comments"."surveyVersion" = %s ', version) +
                'GROUP BY ' +
                '"Comments"."questionId", ' +
                '"Tasks"."uoaId", ' +
                '"Tasks"."productId" ';
            var result = yield thunkQuery(query);
            // get next order
            // if not found records, nextOrder must be 1  - the first comment for question
            return (!_.first(result)) ? 1 : result[0].maxOrder + 1;
            });
    };

    this.getNextAnswerOrder = function (commentId, version) {
        var self = this;
        return co(function* () {
            var query =
                'SELECT ' +
                'max("Comments".order) as "maxOrder" ' +
                'FROM ' +
                '"Comments" ' +
                'WHERE  ' +
                pgEscape('"Comments"."parentId" = %s', commentId) +
                pgEscape(' AND "Comments"."surveyVersion" = %s ', version);
            var result = yield thunkQuery(query);
            // get next order
            // if not found records, nextOrder must be 1  - the first answer for comment
            return (!_.first(result)) ? 1 : result[0].maxOrder + 1;
        });
    };

    this.updateReturnTask = function(commentId) {
            var self = this;
            return co(function* () {
                var result = yield thunkQuery(
                    Comment.update({
                        isResolve: true
                    })
                        .where(
                        Comment.id.equals(commentId)
                    )
                        .returning(Comment.id)
                );
                if (_.first(result)) {
                    bologger.log({
                        req: req,
                        action: 'update',
                        object: 'Comments',
                        entities: commentId,
                        info: 'Resolve flag'
                    });
                }
        });
    };

    this.hideUnhide = function(hide, user, isAdmin, taskId, filter, version) {
        var self = this;
        return co(function* () {
            var query = Comment
                .update({
                    isHidden: hide,
                    userHideId: user.id,
                    hiddenAt: new Date()
                })
                .where(Comment.taskId.equals(taskId))
                .and(Comment.activated.equals(true))
                .and(Comment.surveyVersion.equals(version))
                .returning(Comment.id, Comment.isHidden, Comment.userHideId, Comment.hiddenAt);

            if (!isAdmin) {
                // hide/unhide only self comments
                query = query.and(Comment.userFromId.equals(user.id));
            }
            if (filter && filter.toUpperCase() === 'FLAGGED') {
                // hide/unhide only flagged
                query = query.and(Comment.isReturn.equals(true));
            } else if (filter && parseInt(filter) > 0) {
                // hide/unhide specified comment
                query = query.and(Comment.id.equals(parseInt(filter)));
            } // else hide/unhide all comments for specified task

            var result = yield thunkQuery(query);
            if (_.first(result)) {
                bologger.log({
                    req: req,
                    user: user,
                    action: 'update',
                    object: 'Comments',
                    entities: result,
                    quantity: result.length,
                    info: 'Hide/unhide comment(s)'
                });
            }
        });
    };

    this.answers = {
        agree : function () {
            return '(SELECT sum(CAST(CASE WHEN "c1"."isAgree" THEN 1 ELSE 0 END as INT)) as agree ' +
                'FROM "Comments"  as c1 WHERE "c1"."parentId" = "Comments"."id")';
        },
        disagree : function () {
            return '(SELECT sum(CAST(CASE WHEN "c1"."isAgree" THEN 0 ELSE 1 END as INT)) as disagree ' +
            'FROM "Comments"  as c1 WHERE "c1"."parentId" = "Comments"."id")';
        }
    };

    this.notify = function (commentId, taskId, action, essenceName, templateName, authorId) {
        var self = this;
        co(function* () {
            var userTo, note, usersFromGroup;
            var i, j;
            var note0 = {
                body: req.body.entry,
                isFlagged: req.body.isReturn,
                action: action
            };
            // notify
            var sentUsersId = []; // array for excluding duplicate sending

            // if authorId specified - send notification to author
            if (authorId){
                yield self.notifyOneUser(authorId, note0, commentId, taskId, essenceName, templateName);
                sentUsersId.push(authorId);
            }
            // don't notify users assigned to task - ONLY tagged

            if (req.body.tags) {
                req.body.tags = JSON.parse(req.body.tags);
                for (i in req.body.tags.users) {
                    if (sentUsersId.indexOf(req.body.tags.users[i]) === -1) {
                        yield self.notifyOneUser(req.body.tags.users[i], note0, commentId, taskId, essenceName, templateName);
                        sentUsersId.push(req.body.tags.users[i]);
                    }
                }
                for (i in req.body.tags.groups) {
                    usersFromGroup = yield * common.getUsersFromGroup(req, req.body.tags.groups[i]);
                    for (j in usersFromGroup) {
                        if (sentUsersId.indexOf(usersFromGroup[j].userId) === -1) {
                            yield self.notifyOneUser(usersFromGroup[j].userId, note0, commentId, taskId, essenceName, templateName);
                            sentUsersId.push(usersFromGroup[j].userId);
                        }
                    }
                }
            }
        }).then(function (result) {
            debug('Created notification for comment with id`' + commentId + '`');
        }, function (err) {
            error(JSON.stringify(err));
        });
    };

    this.notifyOneUser = function (userId, note0, entryId, taskId, essenceName, templateName) { // ToDo: move to notification service when refactored
        var self = this;
        return co(function* () {
            var userTo = yield * common.getUser(req, userId);
            var note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
            notifications.notify(req, userTo, note, templateName);
        });
    };

    this.isInt = function (val) {   // ToDo: move to common service
        return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
    };

    this.checkOneId = function(val, model, key, keyName, modelName) { // ToDo: move to common service
        var self = this;
        return co(function* () {
            if (!val) {
                throw new HttpError(403, keyName + ' must be specified');
            } else if (!self.isInt(val)) {
                throw new HttpError(403, keyName + ' must be integer (' + val + ')');
            } else if (_.isString(val) && parseInt(val).toString() !== val) {
                throw new HttpError(403, keyName + ' must be integer (' + val + ')');
            } else {
                var thunkQuery = req.thunkQuery;
                var exist = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(val))));
                if (!_.first(exist)) {
                    throw new HttpError(403, modelName + ' with ' + keyName + '=`' + val + '` does not exist');
                }
            }
            return parseInt(val);
        });
    };

    this.checkString = function(val, keyName) { // ToDo: move to common service
        var self = this;
        return co(function* () {
        if (!val) {
            throw new HttpError(403, keyName + ' must be specified');
        }
        return val;
        });
    };

};
module.exports = exportObject;
