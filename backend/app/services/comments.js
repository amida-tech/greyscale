var
    _ = require('underscore'),
    common = require('app/services/common'),
    Comment = require('app/models/comments'),
    Survey = require('app/models/surveys'),
    SurveyMeta = require('app/models/survey_meta'),
    SurveyQuestion = require('app/models/survey_questions'),
    Task = require('app/models/tasks'),
    WorkflowStep = require('app/models/workflow_steps'),
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

    this.getComments = function (taskId, reqQuery, userId, isAdmin, version) {
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
                .where(Comment.parentId.isNull() // select only comments - not answers
                .and(Comment.taskId.equals(taskId))
                .and(Comment.surveyVersion.equals(version))
            );
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

};
module.exports = exportObject;
