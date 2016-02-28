var
    _ = require('underscore'),
    Essence = require('app/models/essences'),
    Notification = require('app/models/notifications'),
    User = require('app/models/users'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

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

function* createNotification (note) {
    note = yield * checkInsert(note);
    note = _.pick(note, Notification.insertCols); // insert only columns that may be inserted
    return yield thunkQuery(Notification.insert(note).returning(Notification.id));
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
            selectWhere = setWhereInt(selectWhere, req.query.userFrom, 'Notifications', 'userFrom');
            selectWhere = setWhereInt(selectWhere, req.query.userTo, 'Notifications', 'userTo');
            selectWhere = setWhereBool(selectWhere, req.query.read, 'Notifications', 'read');

            var selectQuery = selectFields + selectFrom + selectWhere;
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
            req.body = _.extend(req.body, {readingTime: new Date()});
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
                'SET "read" = true, "readingTime" = now() ';
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
            return yield * createNotification(req.body);
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    createNotification: createNotification

// ToDo: email

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
