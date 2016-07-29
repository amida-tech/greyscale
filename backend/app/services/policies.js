var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    User = require('app/models/users'),
    co = require('co'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    thunkify = require('thunkify'),
    sUser = require('./users');


var exportObject = function  (req, realm) {

    this._lockLimit = 1*60*1000; //one minute

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getById = function (id) {
        return co(function* () {
            var item = yield thunkQuery(Policy.select().where(Policy.id.equals(id)));
            return item[0] || false;
        });
    };

    /**
     * Blocks policy for edit. Works only for socket connections
     * @param id - int, policy id
     * @param userId - int, user id
     * @returns Promise
     */
    this.lockPolicy = function (id, userId, socketId) {
        var self = this;
        return co(function* () {
            var oUser = new sUser(req);
            var policy = yield self.getById(id);

            if (!policy) {
                throw new HttpError(404, "Policy with id = " + id + " does not exist");
            }

            var startEdit = new Date();

            if (policy.socketId && (policy.socketId !== socketId)) {
                var startEditOld = new Date(policy.startEdit);
                var range = startEdit.getTime() - startEditOld.getTime();
                if ((range < self._lockLimit) && (policy.editor !== userId)) {
                    throw new HttpError(403, "Policy already locked");
                }
            }

            var user = yield oUser.getById(userId);

            if (!user) {
                throw new HttpError(403, "User with id = " + userId + " does not exist");
            } else if (user.roleID != 2) {
                throw new HttpError(403, "Only admins can edit a policy");
            }

            var editFields = {
                editor: userId,
                startEdit: startEdit,
                socketId: socketId
            };

            var policy = yield thunkQuery(Policy.update(editFields).where(Policy.id.equals(id)).returning(Policy.star()));
            return policy[0];
        });
    };

    this.updateOne = function (id, oPolicy) {
        var self = this;
        return co(function* () {
            var policy = yield self.getById(id);
            if (!policy) {
                throw new HttpError(404, 'Policy with id = ' + id + ' does not exist');
            }

            if (policy.editor && (policy.editor != req.user.id)) {
                throw new HttpError(403, 'Policy is already editing by other admin');
            }

            if (policy.socketId !== req.body.socketId) {
                debug(policy.socketId);
                debug(req.body.socketId);
                throw new HttpError(403, 'Policy blocked from another connection');
            }

            oPolicy = _.pick(oPolicy, Policy.editCols);
            oPolicy.editor = null; // reset the editor field
            oPolicy.startEdit = null; // reset edit timestamp
            oPolicy.socketId = null; // reset socketId
            if (Object.keys(oPolicy).length) {
                yield thunkQuery(Policy.update(oPolicy).where(Policy.id.equals(id)));
                return true;
            }

            return false;
        });
    };
}

module.exports = exportObject;