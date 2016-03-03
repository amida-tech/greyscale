var
    _ = require('underscore'),
    fs = require('fs'),
    config = require('config'),
    auth = require('app/auth'),
    HttpError = require('app/error').HttpError,
    vl = require('validator'),
    Essence = require('app/models/essences'),
    Notification = require('app/models/notifications'),
    User = require('app/models/users'),
    co = require('co'),
    thunkify = require('thunkify'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkQuery = thunkify(query),
    Emailer = require('lib/mailer');

var socketController = require('app/socket/socket-controller.server');

var isInt = function(val){
    return _.isNumber(parseInt(val)) && !_.isNaN(parseInt(val));
};

var setWhereInt = function(selectQuery, val, model, key){
    var where = (selectQuery === '') ? ' WHERE ' : ' AND ';
    if(val) {
        if ( isInt(val)) {
            selectQuery = selectQuery +where+'"'+model+'"."'+key+'" = '+val;
        }
    }
    return selectQuery;
};

var setWhereBool = function(selectQuery, val, model, key){
    var where = (selectQuery === '') ? ' WHERE ' : ' AND ';
    if(typeof val !== 'undefined') {
        if (val === 'false' || val === 'true'){
            selectQuery = selectQuery +where+'"'+model+'"."'+key+'" = '+val;
        }
        else if (typeof val === 'boolean') {
            selectQuery = selectQuery +where+'"'+model+'"."'+key+'" = '+val.toString();
        }
    }
    return selectQuery;
};

function* checkOneId(val, model, key, keyName, modelName) {
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

function* createNotification (note, template) {
    note = yield * checkInsert(note);
    var note4insert = _.extend({}, note);
    template = (template || {});
    note4insert.note = getHtml(template.notificationName, note4insert, template.notificationPath);
    note4insert = _.pick(note4insert, Notification.insertCols); // insert only columns that may be inserted
    var noteInserted = yield thunkQuery(Notification.insert(note4insert).returning(Notification.id));
    if (parseInt(note.notifyLevel) >  1) {  // onsite notification
        socketController.sendNotification(note.userTo);
    }
    var userTo = yield * getUser(note.userTo);
    if (!vl.isEmail(userTo.email)) {
        throw new HttpError(403, 'Email is not valid: ' + userTo.email); // just in case - I think, it is not possible
    }
    note.message = getHtml(template.emailName, note, template.emailPath);
    var emailOptions = {
        to: {
            name: userTo.firstName,
            surname: userTo.lastName,
            email: userTo.email,
            subject: note.subject
        },
        html: note.message
    };
    var updateFields = _.extend({}, {
        email: userTo.email,
        message: note.message,
        subject: note.subject,
        sent: (parseInt(note.notifyLevel) >  1) ? new Date() : null
        //result: note.result ToDo: Save Result
    });
    var upd = yield thunkQuery(Notification.update(updateFields).where(Notification.id.equals(noteInserted[0].id)));

    if (parseInt(note.notifyLevel) >  1) {  // email notification
        var mailer = new Emailer(emailOptions, note);
        mailer.send(function (error, info) {
            if (error) {
                console.log('EMAIL RESULT ERROR --->>> '+error);
                note.result = error;
            } else
            {
                console.log('EMAIL RESULT --->>> '+info.response);
                note.result = info.response;
            }
        });
    }
    return noteInserted;
}

function* resendNotification (notificationId) {
    var note = yield * getNotification(notificationId);
    //if (parseInt(note.notifyLevel) >  1) {  // email notification - do not check!
    var userTo = yield * getUser(note.userTo);
    var emailOptions = {
        to: {
            name: userTo.firstName,
            surname: userTo.lastName,
            email: userTo.email,
            subject: note.subject
        },
        html: note.message
    };
    var updateFields = _.extend({}, {
        email: userTo.email, // update eMail
        resent: new Date()
        //result: note.result ToDo: Save Result
    });
    var upd = yield thunkQuery(Notification.update(updateFields).where(Notification.id.equals(note.id)));

    var mailer = new Emailer(emailOptions, note);
    mailer.send(function (error, info) {
        if (error) {
            console.log('EMAIL RESULT ERROR --->>> '+error);
            note.result = error;
        } else
        {
            console.log('EMAIL RESULT --->>> '+info.response);
            note.result = info.response;
        }
    });
    //}
    return note;
}

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            req.query = _.extend(req.query, req.body);
            var selectFields =
                'SELECT '+
                '"Notifications".* ';
            var selectUserFromField =
                '(SELECT  '+
                    'CAST( '+
                        'CASE  '+
                            'WHEN "isAnonymous" '+
                                'THEN \'Anonymous\'  '+
                                'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") '+
                        'END as varchar '+
                    ') '+
                    'FROM "Users" '+
                    'WHERE "Users"."id" =  "Notifications"."userFrom" '+
                ') AS "userFromName"';
            var selectUserToField =
                '(SELECT  '+
                    'CAST( '+
                        'CASE  '+
                            'WHEN "isAnonymous" '+
                                'THEN \'Anonymous\'  '+
                                'ELSE CONCAT("Users"."firstName", \' \', "Users"."lastName") '+
                        'END as varchar '+
                    ') '+
                    'FROM "Users" '+
                    'WHERE "Users"."id" =  "Notifications"."userTo" '+
                ') AS "userToName"';
            selectFields = selectFields + ', ' + selectUserFromField + ', ' + selectUserToField;

            var selectFrom =
                'FROM '+
                '"Notifications" ';

            var selectWhere = 'WHERE 1=1 ';
            if (!req.query.userFrom && !req.query.userTo) {
                var userId = (req.query.userId && auth.checkAdmin(req.user)) ? req.query.userId : req.user.id;
                selectWhere = selectWhere + 'AND ("Notifications"."userFrom" = '+ userId.toString() + ' OR "Notifications"."userTo" = '+ userId.toString() + ') ';
            } else {
                selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
                selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
            }
            selectWhere = setWhereBool(selectWhere, req.query.read, 'Notifications', 'read');

            var selectQuery = selectFields + selectFrom + selectWhere;
            return yield thunkQuery(selectQuery, _.pick(req.query, 'limit', 'offset', 'order'));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    users: function (req, res, next) {
        co(function* () {
            req.query = _.extend(req.query, req.body);
            if (!req.query.userFrom && !req.query.userTo) {
                var userId = (req.query.userId && auth.checkAdmin(req.user)) ? req.query.userId : req.user.id;
            }
            var selectQuery =
            'SELECT v1."user" as userId, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'from\' THEN v1."count" ELSE 0 END as INT)) as countFrom, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'to\' THEN v1."count" ELSE 0 END as INT)) as countTo, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'from\' THEN v1."unread" ELSE 0 END as INT)) as unreadFrom, '+
                'sum(CAST(CASE WHEN "v1"."varchar" = \'to\' THEN v1."unread" ELSE 0 END as INT)) as unreadTo '+
                'FROM '+
                '(SELECT '+
                    'count("public"."Notifications"."id") as count, '+
                    '"Notifications"."userFrom" as user, '+
                    'CAST (\'from\' as varchar), '+
                    'sum(CAST(CASE WHEN "public"."Notifications"."read" THEN 0 ELSE 1 END as INT)) as unread '+
                    'FROM "Notifications" '+
                    'WHERE "Notifications"."userTo" = '+parseInt(userId).toString()+' '+
                    'GROUP BY "Notifications"."userFrom" '+
                'UNION '+
                'SELECT '+
                    'count("public"."Notifications"."id") as count, '+
                    '"Notifications"."userTo" as user, '+
                    'CAST (\'to\' as varchar), '+
                    'sum(CAST(CASE WHEN "public"."Notifications"."read" THEN 0 ELSE 1 END as INT)) as unread '+
                    'FROM "Notifications" '+
                    'WHERE "Notifications"."userFrom" = '+parseInt(userId).toString()+' '+
                    'GROUP BY "Notifications"."userTo" '+
                ') as v1 '+
                'GROUP BY v1."user"';
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
        co(function* () {
            req.body = _.pick(req.body, 'read');
            req.body = _.extend(req.body, {reading: new Date()});
            return yield thunkQuery(Notification.update(req.body).where(Notification.id.equals(req.params.notificationId)));
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },
    markAllRead: function (req, res, next) {
        co(function* () {
            req.query = _.extend(req.query, req.body);
            var update =
                'UPDATE '+
                '"Notifications" '+
                'SET "read" = true, "reading" = now() ';
            var where = 'WHERE 1=1 ';
            where = setWhereInt(where, req.query.userFrom, 'Notifications', 'userFrom');
            where = setWhereInt(where, req.query.userTo, 'Notifications', 'userTo');

            var query = update + where;
            return yield thunkQuery(query);
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },
    deleteList: function (req, res, next) {
        co(function* () {
            req.query = _.extend(req.query, req.body);
            var deleteQuery =
                'DELETE FROM "Notifications" ';
            var where = '';
            if (typeof req.body.all === 'undefined') {
                if (typeof req.body.id !== 'undefined') {
                    where = setWhereInt(where, req.query.id, 'Notifications', 'id');
                } else {
                    where = setWhereInt(where, req.query.userFrom, 'Notifications', 'userFrom');
                    where = setWhereInt(where, req.query.userTo, 'Notifications', 'userTo');
                }
                if (where === '') where = 'WHERE 1=0';
            }

            var query = deleteQuery + where;
            return yield thunkQuery(query);
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            req.body.userFrom = req.user.id; // ignore userFrom from body - use from req.user
            return yield * createNotification(req.body);
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    createNotification: createNotification,

    resend: function (req, res, next) {
        co(function* () {
            return yield * resendNotification(req.params.notificationId);
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    resendUserInvite: function (req, res, next) {
        co(function* () {
            var result = yield * getInviteNotification(req.params.userId);
            if (!_.first(result)) {
                var user = yield * getUser(req.params.userId);
                var org = yield * getOrganization(user.organizationId);
                var essenceId = yield * getEssenceId('Users');
                var note = yield * createNotification(
                    {
                        userFrom: req.user.id,
                        userTo: user.id,
                        body: 'New user added',
                        essenceId: essenceId,
                        entityId: user.id,
                        notifyLevel: user.notifyLevel,
                        name: user.firstName,
                        surname: user.lastName,
                        company: org,
                        inviter: req.user,
                        token: user.activationToken,
                        subject: 'Indaba. Organization membership'
                    },
                    {
                        notificationName: 'org_invite',
                        notificationPath: './views/notifications/',
                        emailName: 'org_invite',
                        emailPath: './views/emails/'
                    }
                );
                if (user.notifyLevel < 2) {
                    return yield * resendNotification(note[0].id);
                }
                return note;
            } else {
                return yield * resendNotification(result[0].id);
            }
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    }

};

function* checkInsert(note) {
    var userFromId = yield * checkOneId(note.userFrom, User, 'id', 'userFrom', 'User');
    var userToId = yield * checkOneId(note.userTo, User, 'id', 'userTo', 'User');
    var body = yield * checkString(note.body, 'Body');
    if (note.essenceId) {
        var essenceId = yield * checkOneId(note.essenceId, Essence, 'id', 'essenceId', 'Essence');
        var essence = yield * getEssence(essenceId);
        var model;
        try {
            model = require('app/models/' + essence.fileName);
        } catch (err) {
            throw new HttpError(403, 'Cannot find model file: ' + essence.fileName);
        }
        var entityId = yield * checkOneId(note.entityId, model, 'id', 'id', 'Discussion`s entry');
    }
    return note;
}


function* getEssence(essenceId) {
    // get Essence info
    query =
        'SELECT '+
        '"Essences".* '+
        'FROM "Essences" '+
        'WHERE "Essences"."id" = '+essenceId.toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find essenceId='+essenceId.toString()); // just in case - I think, it is not possible case, because have been checked before
    }
    return {
        tableName: result[0].tableName,
        name: result[0].name,
        fileName: result[0].fileName,
        nameField: result[0].nameField
    };

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

function* getUser(userId) {
    query =
        'SELECT "Users".* '+
        'FROM "Users" '+
        'WHERE "Users"."id" = ' + parseInt(userId).toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find User with id `'+parseInt(userId).toString()+'`');
    }
    return result[0];
}

function* getOrganization(orgId) {
    query =
        'SELECT "Organizations".* FROM "Organizations" '+
        'WHERE "Organizations"."id" = ' + parseInt(orgId).toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Organization with id `'+parseInt(orgId).toString()+'`');
    }
    return result[0];
}

function* getNotification(notificationId) {
    query =
        'SELECT "Notifications".* '+
        'FROM "Notifications" '+
        'WHERE "Notifications"."id" = ' + parseInt(notificationId).toString();
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Notification with id `'+parseInt(notificationId).toString()+'`');
    }
    return result[0];
}

function* getInviteNotification(userId) {
    // get EssenceId
    var essenceId = yield * getEssenceId('Users');
    query =
        'SELECT '+
            'max("Notifications"."id") as id '+
        'FROM "Notifications" '+
        'WHERE '+
            '"Notifications"."essenceId" = '+essenceId.toString()+ ' AND '+
            '"Notifications"."entityId" = '+userId.toString() + ' '+
        'GROUP BY '+
            '"Notifications"."essenceId", '+
            '"Notifications"."entityId"';
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        //throw new HttpError(403, 'Error find Invite notification for user id=`'+userId.toString()+'`');
        console.log('Does not find Invite notification for user id=`'+userId.toString()+'`');
    }
    return result;
}

function* getEssenceId(essenceName) {
    query =
        'SELECT '+
        '"Essences"."id" '+
        'FROM "Essences" '+
        'WHERE "Essences"."name" = \''+essenceName+'\'';
    result = yield thunkQuery(query);
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Essence `'+essenceName+'"');
    }
    return result[0].id;
}
