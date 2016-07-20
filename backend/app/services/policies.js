var
    _ = require('underscore'),
    Policy = require('app/models/policies'),
    sAttachment = require('app/services/attachments'),
    sEssence = require('app/services/essences'),
    co = require('co'),
    HttpError = require('app/error').HttpError,
    sUser = require('./users');


var exportObject = function  (req, realm) {

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

    this.setEditor = function (id, userId) { // for safety, have to do separate update method
        return co(function* () {
            var oUser = new sUser(req);
            var user = yield oUser.getById(userId);
            if (!user) {
                throw new HttpError(403, "User with id = " + userId + " does not exist");
            } else if (user.roleID != 2) {
                throw new HttpError(403, "Only admins can edit a policy");
            }

            var editFields = {
                editor: userId,
                startEdit: new Date()
            };

            return yield thunkQuery(Policy.update(editFields).where(Policy.id.equals(id)));
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

            oPolicy = _.pick(oPolicy, Policy.editCols);
            oPolicy.editor = null; // reset the editor field
            oPolicy.startEdit = null; // reset edit timestamp
            if (Object.keys(oPolicy).length) {
                yield thunkQuery(Policy.update(oPolicy).where(Policy.id.equals(id)));
                return true;
            }

            return false;
        });
    };

    this.deleteOne = function (id) {
        var oEssence = new sEssence(req);
        var oAttachment = new sAttachment(req);
        return co(function* () {
            var essence = yield oEssence.getByTableName('Policies');
            if (essence) {
                 yield oAttachment.deleteEntityAttachments(essence.id, id);
            }

            yield thunkQuery(Policy.delete().where(Policy.id.equals(id)));
        });
    };
}

module.exports = exportObject;