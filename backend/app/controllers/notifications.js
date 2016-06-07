var
    _ = require('underscore'),
    ejs = require('ejs'),
    fs = require('fs'),
    config = require('config'),
    common = require('app/services/common'),
    auth = require('app/auth'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    HttpError = require('app/error').HttpError,
    vl = require('validator'),
    Essence = require('app/models/essences'),
    Product = require('app/models/products'),
    Organization = require('app/models/organizations'),
    Workflow = require('app/models/workflows'),
    WorkflowStep = require('app/models/workflow_steps'),
    Survey = require('app/models/surveys'),
    Policy = require('app/models/policies'),
    Task = require('app/models/tasks'),
    UOA = require('app/models/uoas'),
    Notification = require('app/models/notifications'),
    User = require('app/models/users'),
    co = require('co'),
    thunkify = require('thunkify'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkQuery = thunkify(query),
    Emailer = require('lib/mailer'),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_notifications');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var socketController = require('app/socket/socket-controller.server');

var isInt = function(val){
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function(selectQuery, val, model, key){
    var where = (selectQuery === '') ? ' WHERE ' : ' AND ';
    if(val) {
        if ( isInt(val)) {
            selectQuery = selectQuery +pgEscape('%s "%I"."%I" = %s', where, model, key, val);
        }
    }
    return selectQuery;
};

var whereInt = function(selectQuery, val, model, key){
    if(val) {
        if ( isInt(val)) {
            selectQuery = selectQuery.where(model[key].equals(val));
        }
    }
    return selectQuery;
};

var setWhereBool = function(selectQuery, val, model, key){
    var where = (selectQuery === '') ? ' WHERE ' : ' AND ';
    if(typeof val !== 'undefined') {
        if (val === 'false' || val === 'true'){
            selectQuery = selectQuery +pgEscape('%s "%I"."%I" = %s', where, model, key, val);
        }
        else if (typeof val === 'boolean') {
            selectQuery = selectQuery +pgEscape('%s "%I"."%I" = %s', where, model, key, val);
        }
    }
    return selectQuery;
};

function* checkOneId(req, val, model, key, keyName, modelName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    else if (!isInt(val)) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    else if (_.isString(val) && parseInt(val).toString() !== val) {
        throw new HttpError(403, keyName + ' must be integer (' + val + ')');
    }
    else {
        var thunkQuery = req.thunkQuery;
        var exist = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(val))));
        if (!_.first(exist)) {
            throw new HttpError(403, modelName +' with '+keyName+'=`'+val+'` does not exist');
        }
    }
    return parseInt(val);
}

function* checkString(val, keyName) {
    if (!val) {
        throw new HttpError(403, keyName +' must be specified');
    }
    return val;
}

function* createNotification (req, note, template) {
    var thunkQuery = req.thunkQuery;
    note = yield * checkInsert(req, note);
    var note4insert = _.extend({}, note);
    template = (template || 'default');
    if (!config.notificationTemplates[template]) {
        template = 'default';
    }

    note4insert.note = yield * renderFile(config.notificationTemplates[template].notificationBody, note4insert);
    note4insert = _.pick(note4insert, Notification.insertCols); // insert only columns that may be inserted
    var noteInserted = yield thunkQuery(Notification.insert(note4insert).returning(Notification.id));
    if (parseInt(note.notifyLevel) >  1) {  // onsite notification
        socketController.sendNotification(note.userTo);
    }
    var userTo = yield * common.getUser(req, note.userTo);
    if (!vl.isEmail(userTo.email)) {
        throw new HttpError(403, 'Email is not valid: ' + userTo.email); // just in case - I think, it is not possible
    }
    if (typeof note.notifyLevel == 'undefined'){
        note.notifyLevel = userTo.notifyLevel;
    }
    note.subject = note.subject || '';
    note.subject = ejs.render(config.notificationTemplates[template].subject, note);
    note.message = yield * renderFile(config.notificationTemplates[template].emailBody, note);
    var emailOptions = {
        to: {
            name: userTo.firstName,
            surname: userTo.lastName,
            email: userTo.email,
            subject: note.subject
        },
        html: note.message
    };

    var updateFields = {
        email: userTo.email,
        message: note.message,
        subject: note.subject,
        sent: (parseInt(note.notifyLevel) >  1) ? new Date() : null,
        notifyLevel: note.notifyLevel
        //result: note.result
    };
    // update email's fields before sending
    var upd = yield thunkQuery(Notification.update(updateFields).where(Notification.id.equals(noteInserted[0].id)));

    if (parseInt(note.notifyLevel) >  1 && !config.email.disable) {  // email notification
        sendEmail(req, emailOptions, note, noteInserted[0].id);
    }

    bologger.log({
        req: req,
        user: req.user,
        action: 'insert',
        object: 'notifications',
        entity: _.first(noteInserted).id,
        info: 'Add new notification'
    });
    return noteInserted;
}

function* resendNotification (req, notificationId) {
    var thunkQuery = req.thunkQuery;
    if (config.email.disable) {
        return false;
    }
    var note = yield * common.getNotification(req, notificationId);
    //if (parseInt(note.notifyLevel) >  1) {  // email notification - do not check!
    var userTo = yield * common.getUser(req, note.userTo);
    var emailOptions = {
        to: {
            name: userTo.firstName,
            surname: userTo.lastName,
            email: userTo.email,
            subject: note.subject
        },
        html: note.message
    };

    var updateFields = {
        email: userTo.email,
        resent: new Date()
        //result: note.result
    };
    // update email's fields before sending
    var upd = yield thunkQuery(Notification.update(updateFields).where(Notification.id.equals(note.id)));

    if (!config.email.disable) {  // email notification - does not use notifyLevel
        sendEmail(req, emailOptions, note, note.id);
    }

    return note;
}

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            req.query = _.extend(req.query, req.body);
            var isNotAdmin = !auth.checkAdmin(req.user);
            var currentUserId = req.user.id;
            var essenceId = yield * common.getEssenceId(req, 'Discussions');
            var userId = req.user.id;

            var selectWhere = 'WHERE 1=1 ';
            if (isNotAdmin) { // not Admin - only self incoming notifications
                selectWhere = setWhereInt(selectWhere, userId, 'Notifications', 'userTo');
                if (req.query.userFrom) { //if specified - filter userFrom
                    selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                }
                // all other query parameters - ignored
            } else { // Admin - can request any filtered notifications
                if (!req.query.userFrom && !req.query.userTo) {
                    userId = (req.query.userId && !isNotAdmin) ? req.query.userId : req.user.id;
                    selectWhere = selectWhere + pgEscape('AND ("Notifications"."userFrom" = %s OR "Notifications"."userTo" = %s ) ', userId, userId);
                } else if (req.query.userFrom && !req.query.userTo) {
                    selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                    selectWhere = setWhereInt(selectWhere, userId, 'Notifications', 'userTo');
                } else if (!req.query.userFrom && req.query.userTo) {
                    selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
                } else {
                    selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                    selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
                }
            }
            selectWhere = setWhereBool(selectWhere, req.query.read, 'Notifications', 'read');

            var withNotes = pgEscape('WITH notes as (SELECT "Notifications".* FROM "Notifications" %s)', selectWhere);
            var withUFrom = pgEscape('uFrom as (SELECT DISTINCT "Users".* FROM "Notifications" INNER JOIN "Users" ON "Users"."id" =  "Notifications"."userFrom" %s ) ', selectWhere);
            var withUTo = pgEscape('uTo as (SELECT DISTINCT "Users".* FROM "Notifications" INNER JOIN "Users" ON "Users"."id" =  "Notifications"."userTo" %s ) ', selectWhere);

            var mainSelectCase =
            'SELECT '+
            'CAST( '+
                'CASE '+
            pgEscape('WHEN (notes."essenceId" = %s AND notes."userFromName" IS NOT NULL) THEN notes."userFromName" ', essenceId)+
            pgEscape('WHEN ( uFrom."isAnonymous" AND %s AND uFrom."id" <> %s) THEN \'Anonymous\' ', isNotAdmin, currentUserId)+
            'ELSE CONCAT(uFrom."firstName", \' \', uFrom."lastName") '+
            'END as varchar) AS "userFromName", '+
            'CAST( '+
                'CASE '+
            pgEscape('WHEN (notes."essenceId" = %s AND notes."userToName" IS NOT NULL) THEN notes."userToName" ', essenceId)+
            pgEscape('WHEN ( uTo."isAnonymous" AND %s AND uTo."id" <> %s) THEN \'Anonymous\' ', isNotAdmin, currentUserId)+
            'ELSE CONCAT(uTo."firstName", \' \', uTo."lastName") '+
            'END as varchar) AS "userToName", ';

            var mainSelectRest =
                'notes."id", '+
                'notes."userFrom", '+
                'notes."userTo", '+
                'notes.body, '+
                'notes.email, '+
                'notes.message, '+
                'notes.subject, '+
                'notes."essenceId", '+
                'notes."entityId", '+
                'notes.created, '+
                'notes.reading, '+
                'notes.sent, '+
                'notes."read", '+
                'notes."notifyLevel", '+
                'notes.result, '+
                'notes.resent, '+
                'notes.note '+
                'FROM notes '+
                'LEFT JOIN uFrom ON notes."userFrom" = uFrom."id" '+
                'LEFT JOIN uTo ON notes."userTo" = uTo."id" '+
                'ORDER BY notes."id"';

            var selectQuery = withNotes + ', ' + withUFrom + ', ' + withUTo + mainSelectCase + mainSelectRest;
            return yield thunkQuery(selectQuery, _.pick(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    users: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            req.query = _.extend(req.query, req.body);
            var isNotAdmin = !auth.checkAdmin(req.user);
            var userId = req.user.id;
            if (!req.query.userFrom && !req.query.userTo) {
                userId = (req.query.userId && !isNotAdmin) ? req.query.userId : userId;
            }

            var selectWhere = 'WHERE 1=1 ';
            if (!req.query.userFrom && !req.query.userTo) {
                userId = (req.query.userId && !isNotAdmin) ? req.query.userId : req.user.id;
                selectWhere = selectWhere + pgEscape('AND ("Notifications"."userFrom" = %s OR "Notifications"."userTo" = %s ) ', userId, userId);
            } else if (req.query.userFrom && !req.query.userTo) {
                selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                selectWhere = setWhereInt(selectWhere, userId, 'Notifications', 'userTo');
            } else if (!req.query.userFrom && req.query.userTo) {
                selectWhere = setWhereInt(selectWhere, userId, 'Notifications', 'userFrom');
                selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
            } else if (!isNotAdmin){
                selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
            } else {
                selectWhere = selectWhere + pgEscape('AND ("Notifications"."userFrom" = %s OR "Notifications"."userTo" = %s) ', userId, userId);
            }
            selectWhere = setWhereBool(selectWhere, req.query.read, 'Notifications', 'read');

            var withFrom =
                'WITH c1 as (SELECT '+
                'count("Notifications"."id") as count, '+
                '"Notifications"."userFrom" as user, '+
                '"Notifications"."entityId" as entityid, '+
                '"Notifications"."essenceId" as essenceid, '+
                '"Users"."firstName" AS firstName, '+
                '"Users"."lastName" AS lastName,  '+
                '"Users"."isAnonymous" AS isAnonymous, '+
                'CAST (\'from\' as varchar),  '+
                'sum(CAST(CASE WHEN "Notifications"."read" THEN 0 ELSE 1 END as INT)) as unread '+
                'FROM "Notifications"  '+
                'INNER JOIN "Users" ON "Notifications"."userFrom" = "Users"."id" '+
                pgEscape.string(selectWhere)+ ' '+
                'GROUP BY "Notifications"."userFrom", "Notifications"."entityId", "Notifications"."essenceId", "Users"."firstName", "Users"."lastName", "Users"."isAnonymous" '+
                ') ';
            var withTo =
                'c2 as (SELECT '+
                'count("Notifications"."id") as count, '+
                '"Notifications"."userTo" as user, '+
                '"Notifications"."entityId" as entityid, '+
                '"Notifications"."essenceId" as essenceid, '+
                '"Users"."firstName" AS firstName, '+
                '"Users"."lastName" AS lastName,  '+
                '"Users"."isAnonymous" AS isAnonymous, '+
                'CAST (\'to\' as varchar),  '+
                'sum(CAST(CASE WHEN "Notifications"."read" THEN 0 ELSE 1 END as INT)) as unread '+
                'FROM "Notifications"  '+
                'INNER JOIN "Users" ON "Notifications"."userTo" = "Users"."id" '+
                pgEscape.string(selectWhere)+ ' '+
                'GROUP BY "Notifications"."userTo", "Notifications"."entityId", "Notifications"."essenceId", "Users"."firstName", "Users"."lastName", "Users"."isAnonymous" '+
                ') ';
            var withPivot =
                'c3 as (SELECT ' +
                'v1."user" as userid, '+
                'v1."entityid" as entityid, '+
                'v1."essenceid" as essenceid, '+
                pgEscape('CAST( CASE WHEN "v1"."isanonymous" and %s AND ("v1"."user" <> %s) ', isNotAdmin, userId)+
                'THEN \'Anonymous\' ELSE "v1"."firstname" END as varchar) AS "firstName", '+
                pgEscape('CAST( CASE WHEN "v1"."isanonymous" and %s AND ("v1"."user" <> %s) ', isNotAdmin, userId)+
                'THEN \'\' ELSE "v1"."lastname" END as varchar) AS "lastName", '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'from\' THEN v1."count" ELSE 0 END as INT)) as countFrom, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'to\' THEN v1."count" ELSE 0 END as INT)) as countTo, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'from\' THEN v1."unread" ELSE 0 END as INT)) as unreadFrom, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'to\' THEN v1."unread" ELSE 0 END as INT)) as unreadTo FROM '+
                '( '+
                'select * from c1 '+
                'UNION '+
                'select * from c2 '+
                ') as v1 '+
                'GROUP BY v1."user", v1."entityid", v1."essenceid", v1."firstname", v1."lastname", v1."isanonymous" '+
                ') ';
            var withc4 =
                'c4 as (SELECT ' +
                'c3.*, '+
                '"Discussions"."taskId" as taskid, '+
                '"Tasks"."stepId" as stepid, '+
                '"WorkflowSteps"."title" as stepname, '+
                '"WorkflowSteps"."role" as role '+
                'FROM c3 '+
                'LEFT JOIN "Discussions" ON c3."entityid" = "Discussions"."id" '+
                'LEFT JOIN "Tasks" ON "Discussions"."taskId" = "Tasks"."id" '+
                'LEFT JOIN "WorkflowSteps" ON "Tasks"."stepId" = "WorkflowSteps"."id" '+
                ') ';
            var mainQuery ='SELECT '+
                'c4."userid", '+
                'CASE  WHEN c4."role" IS NOT NULL THEN  c4."role" ELSE c4."firstName" END as role, '+
                'CASE  WHEN c4."stepname" IS NOT NULL THEN  c4."stepname" ELSE c4."lastName" END as stepname, '+
                'c4."firstName" as firstname, '+
                'c4."lastName" as lastname, '+
                'c4."essenceid" as essenceid, '+
                'c4."entityid" as entityid, '+
                'sum(c4."countfrom") as countfrom, '+
                'sum(c4."countto") as countto,'+
                'sum(c4."unreadfrom") as unreadfrom, '+
                'sum(c4."unreadto") as unreadto '+
                'FROM c4 '+
                'GROUP BY c4."userid", c4."firstName", c4."lastName", c4."stepname", c4."role", c4."essenceid", c4."entityid" ';

            var selectQuery = withFrom + ', ' + withTo + ', ' + withPivot + ', ' + withc4 + mainQuery;

            return yield thunkQuery(selectQuery, _.pick(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    changeRead: function (read) {
        return function (req, res, next) {
            req.body.read = read;
            next();
        };
    },

    markReadUnread: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            req.body = _.pick(req.body, 'read');
            req.body = _.extend(req.body, {reading: new Date()});
            return yield thunkQuery(Notification.update(req.body).where(Notification.id.equals(req.params.notificationId)));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'notifications',
                entity: req.params.notificationId,
                info: 'Mark notification as '+(req.body.read ? 'read' : 'unread')
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },
    markAllRead: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var selectQuery;
        co(function* () {
            req.query = _.extend(req.query, req.body);
            selectQuery = Notification.update({read: true, reading: new Date()});
            selectQuery = whereInt(selectQuery, req.query.userFrom, Notification, 'userFrom');
            selectQuery = whereInt(selectQuery, req.query.userTo, Notification, 'userTo');
            selectQuery = selectQuery.returning(Notification.id);
            return yield thunkQuery(selectQuery);
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'notifications',
                entities: data,
                quantity: data.length,
                info: 'Mark as read all notifications '+(selectQuery.whereClause ? selectQuery.whereClause.toString() : '')
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },
    deleteList: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        var selectQuery;
        co(function* () {
            req.query = _.extend(req.query, req.body);
            selectQuery = Notification.delete();
            if (typeof req.query.all === 'undefined') {
                if (typeof req.query.id !== 'undefined') {
                    selectQuery = whereInt(selectQuery, req.query.id, Notification, 'id');
                } else {
                    selectQuery = whereInt(selectQuery, req.query.userFrom, Notification, 'userFrom');
                    selectQuery = whereInt(selectQuery, req.query.userTo, Notification, 'userTo');
                }
                if (!selectQuery.whereClause) {
                    return null;
                }
            }
            selectQuery = selectQuery.returning(Notification.id);
            return yield thunkQuery(selectQuery);
        }).then(function (data) {
            if (data) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'delete',
                    object: 'notifications',
                    entities: data,
                    quantity: data.length,
                    info: 'Delete all notifications '+(selectQuery.whereClause ? selectQuery.whereClause.toString() : '')
                });
            }
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            req.body.userFrom = req.user.realmUserId; // ignore userFrom from body - use from req.user/ !! Use realmUserId instead of user id
            return yield * createNotification(req, req.body);
        }).then(function (data) {
/*
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'notifications',
                entity: _.first(data).id,
                info: 'Add new notification'
            });
*/
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    reply: function (req, res, next) {
        co(function* () {
            var note = yield * common.getNotification(req, req.params.notificationId);
            if (req.user.id !== note.userTo && !auth.checkAdmin(req.user)) {
                throw new HttpError(403, 'You cannot send reply for this notification (not yours)!');
            }
            req.body.userTo = note.userFrom;    // get userTo for reply from userFrom
            delete note.notifyLevel;            // don't use notifyLevel from source note - use it from user
            return note;
        }).then(function (data) {
            next();
        }, function (err) {
            next(err);
        });
    },

    createNotification: createNotification,
    extendNote: extendNote,
    notify: notify,

    resend: function (req, res, next) {
        co(function* () {
            return yield * resendNotification(req, req.params.notificationId);
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'notifications',
                entity: req.params.notificationId,
                info: 'Resend notification'
            });
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    resendUserInvite: function (req, res, next) {
        var resend = false;
        var logUser = 'user';
        co(function* () {
            var user = yield * common.getUser(req, req.params.userId);
            var body = 'Invite';
            var subject = 'Indaba. Organization membership';
            var template = 'orgInvite';
            var superUser = (user && user.roleID === 1);
            if (superUser) {
                body = 'Superadmin Invite';
                subject ='Indaba. Superadmin invite';
                template = 'invite';
                logUser = 'superuser';
            }
            var inviteNote = yield * getInviteNotification(req, req.params.userId, body);
            if (!inviteNote) {
                var org = null;
                if (!superUser) {
                    org = yield * common.getOrganization(req, user.organizationId);
                }
                var essenceId = yield * common.getEssenceId(req, 'Users');
                var note = yield * createNotification(req,
                    {
                        userFrom: req.user.realmUserId,
                        userTo: user.id,
                        body: body,
                        essenceId: essenceId,
                        entityId: user.id,
                        notifyLevel: user.notifyLevel,
                        name: user.firstName,
                        surname: user.lastName,
                        company: org,
                        inviter: req.user,
                        token: user.activationToken,
                        subject: subject,
                        config: config
                    },
                    template
                );
/*
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'notifications',
                    entity: note[0].id,
                    info: 'Create '+logUser+' invite notification'
                });
*/
                if (user.notifyLevel < 2) {
                    resend = note[0].id;
                    return yield * resendNotification(req, note[0].id);
                }
                return note;
            } else {
                resend = inviteNote.id;
                return yield * resendNotification(req, inviteNote.id);
            }
        }).then(function (data) {
            if (resend) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'notifications',
                    entity: resend,
                    info: 'Resend '+logUser+' invite notification'
                });
            }
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    }

};

function* checkInsert(req, note) {
    var userFromId = yield * checkOneId(req, note.userFrom, User, 'id', 'userFrom', 'User');
    var userToId = yield * checkOneId(req, note.userTo, User, 'id', 'userTo', 'User');
    var body = yield * checkString(note.body, 'Body');
    if (note.essenceId) {
        // check essenceId and entityId if specified
        var essenceId = yield * checkOneId(req, note.essenceId, Essence, 'id', 'essenceId', 'Essence');
        var essence = yield * common.getEssence(req, essenceId);
        var model;
        try {
            model = require('app/models/' + essence.fileName);
        } catch (err) {
            throw new HttpError(403, 'Cannot find model file: ' + essence.fileName);
        }
        var entityId = yield * checkOneId(req, note.entityId, model, 'id', 'id', 'Notification`s entity('+essence.fileName+')');
    }
    return note;
}


function getHtml(templateName, data, templatePath) {
    templateName =  (templateName || 'default');
    var templateFile =  (templatePath || './views/notifications/') + templateName + '.html';
    var templateContent = fs.readFileSync(templateFile, 'utf8');
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };
    data.config = config;
    return _.template(templateContent)(data);
}

function* getInviteNotification(req, userId, body) {
    // get EssenceId
    var essenceId = yield * common.getEssenceId(req, 'Users');
    query =
        'SELECT '+
            'max("Notifications"."id") as id '+
        'FROM "Notifications" '+
        'WHERE '+
            pgEscape('"Notifications"."body" = %L AND ', body)+
            pgEscape('"Notifications"."essenceId" = %s AND ', essenceId)+
            pgEscape('"Notifications"."entityId" = %s ',userId)+
        'GROUP BY '+
            '"Notifications"."essenceId", '+
            '"Notifications"."entityId"';
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        //throw new HttpError(403, 'Error find Invite notification for user id=`'+userId.toString()+'`');
        debug('Does not find Invite notification for user id=`'+userId.toString()+'`');
    }
    return result[0];
}

function* renderFile(templateFile, data) {
    var res;
    try {
        ejs.renderFile(templateFile, data, function (err, result) {
            if (err) {
                throw err;
            }
            res = result;
        });
    }
    catch(e) {
        throw new HttpError(403, 'Error render template file `'+templateFile+'` error: `'+e.message+'`');
    }
    return res;
}

function sendEmail(req, emailOptions, note, noteId) {
    co(function* () {
        var mailer = new Emailer(emailOptions, note);
        //Sync mail send
        var err = false;
        var sendResult = yield * mailer.sendSync();
        err = sendResult.name === 'Error';
        if (err) {
            debug('EMAIL RESULT ERROR --->>> '+sendResult.message);
            note.result = sendResult.message;
        } else
        {
            debug('EMAIL RESULT --->>> '+sendResult.response);
            note.result = sendResult.response;
        }
        var email = (emailOptions.to) ? emailOptions.to.email : '';
        bologger.log({
            req: req,
            user: req.user,
            action: 'insert',
            object: 'notifications',
            entity: noteId,
            info: 'Send email to '+email+' `'+note.body+'` , result: '+note.result
        });
        return note.result;
    }).then(function (result) {
        co(function* () {
            var thunkQuery = req.thunkQuery;
            var upd = yield thunkQuery(Notification.update({result: result}).where(Notification.id.equals(noteId)));
        });
    });
}

function notify(req, userTo, note, template) {
    co(function* () {
        var thunkQuery = req.thunkQuery;
        note = yield * checkInsert(req, note);
        var note4insert = _.extend({}, note);
        template = (template || 'default');
        if (!config.notificationTemplates[template]) {
            template = 'default';
        }

        note4insert.note = yield * renderFile(config.notificationTemplates[template].notificationBody, note4insert);
        note4insert = _.pick(note4insert, Notification.insertCols); // insert only columns that may be inserted
        var noteInserted = yield thunkQuery(Notification.insert(note4insert).returning(Notification.id));
        if (parseInt(note.notifyLevel) >  1) {  // onsite notification
            socketController.sendNotification(note.userTo);
        }
        var userTo = yield * common.getUser(req, note.userTo);
        if (!vl.isEmail(userTo.email)) {
            throw new HttpError(403, 'Email is not valid: ' + userTo.email); // just in case - I think, it is not possible
        }
        if (typeof note.notifyLevel == 'undefined'){
            note.notifyLevel = userTo.notifyLevel;
        }
        note.subject = note.subject || '';
        note.subject = ejs.render(config.notificationTemplates[template].subject, note);
        note.message = yield * renderFile(config.notificationTemplates[template].emailBody, note);
        var emailOptions = {
            to: {
                name: userTo.firstName,
                surname: userTo.lastName,
                email: userTo.email,
                subject: note.subject
            },
            html: note.message
        };

        var updateFields = {
            email: userTo.email,
            message: note.message,
            subject: note.subject,
            sent: (parseInt(note.notifyLevel) >  1) ? new Date() : null,
            notifyLevel: note.notifyLevel
            //result: note.result
        };
        // update email's fields before sending
        var upd = yield thunkQuery(Notification.update(updateFields).where(Notification.id.equals(noteInserted[0].id)));

        if (parseInt(note.notifyLevel) >  1 && !config.email.disable) {  // email notification
            sendEmail(req, emailOptions, note, noteInserted[0].id);
        }

        bologger.log({
            req: req,
            user: req.user,
            action: 'insert',
            object: 'notifications',
            entity: _.first(noteInserted).id,
            info: 'Add new notification'
        });

        return noteInserted;
    }).then(function (result) {
        debug('Created notification `'+ note.body+'`');
    }, function (err) {
        error(JSON.stringify(err));
    });
}

function* extendNote(req, note, userTo, essenceName, entityId, orgId, taskId) {

    if (essenceName && essenceName.length > 0) {
        var essenceId = yield * common.getEssenceId(req, essenceName);
        note = _.extend(note, {
                essenceId: essenceId,
                entityId: entityId
            }
        );
    }
    var organization = yield * common.getEntity(req, orgId, Organization, 'id');
    var task = yield * common.getTask(req, taskId);
    var product = yield * common.getEntity(req, task.productId, Product, 'id');
    var uoa = yield * common.getEntity(req, task.uoaId, UOA, 'id');
    var step = yield * common.getEntity(req, task.stepId, WorkflowStep, 'id');
    var survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');
    var policy = yield * common.getEntity(req, survey.policyId, Policy, 'id');

    note = _.extend(note, {
            userFrom: req.user.realmUserId,
            userTo: userTo.id,
            task: task,
            product: product,
            uoa: uoa,
            step: step,
            survey: survey,
            policy: survey,
            user: userTo,
            organization: organization,
            date: new Date(),
            to: {firstName : userTo.firstName, lastName: userTo.lastName},
            config: config
        }
    );
    return note;
}
