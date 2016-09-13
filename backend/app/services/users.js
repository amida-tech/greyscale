var
    _ = require('underscore'),
    User = require('app/models/users'),
    Role = require('app/models/roles'),
    Organization = require('app/models/organizations'),
    /*Project = require('app/models/projects'),*/
    co = require('co'),
    Query = require('app/util').Query,
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError;


var exportObject = function  (req, realm) {

    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getById = function (id) {
        return co(function* () {
            var result = yield thunkQuery(User.select().where(User.id.equals(id)));
            return result[0] || false;
        });
    };

    this.getInfo = function (id) {
        return co(function* () {
            var data = yield thunkQuery(
                User
                    .select(
                        User.star(),
                        Role.name.as('role'),
                        'ARRAY(' +
                            ' SELECT "Rights"."action" FROM "RolesRights" ' +
                            ' LEFT JOIN "Rights"' +
                            ' ON ("RolesRights"."rightID" = "Rights"."id")' +
                            ' WHERE "RolesRights"."roleID" = "Users"."roleID"' +
                        ') AS rights'/*,
                        Project.id.as('projectId')*/
                    )
                    .from(
                        User
                            .leftJoin(Role).on(User.roleID.equals(Role.id))
                            .leftJoin(Organization).on(User.organizationId.equals(Organization.id))
                            /*.leftJoin(Project).on(Project.organizationId.equals(Organization.id))*/
                    )
                    .where(
                        User.id.equals(id)
                    )
            );
            return data[0] ? _.pick(data[0], User.sesInfo) : false;
        });
    };

};

module.exports = exportObject;
