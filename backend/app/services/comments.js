var
    _ = require('underscore'),
    common = require('app/services/common'),
    Comment = require('app/models/comments'),
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
