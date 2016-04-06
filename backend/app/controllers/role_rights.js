var _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    RoleRights = require('app/models/role_rights'),
    Roles = require('app/models/roles'),
    Rights = require('app/models/rights'),
    vl = require('validator'),
    HttpError = require('app/error').HttpError,
    util = require('util'),
    async = require('async'),
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var _counter = thunkQuery(
                RoleRights
                .select(RoleRights.count('counter'))
                .where(RoleRights.roleID.equals(req.params.roleID)),
                _.omit(req.query, 'offset', 'limit', 'order')
            );
            var roleRight = thunkQuery(
                RoleRights
                .select(Rights.star())
                .from(
                    RoleRights.leftJoin(Rights)
                    .on(RoleRights.rightID.equals(Rights.id))
                )
                .where(RoleRights.roleID.equals(req.params.roleID)),
                req.query);

            return yield [_counter, roleRight];
        }).then(function (data) {
            res.set('X-Total-Count', _.first(data[0]).counter);
            res.json(_.last(data));
        }, function (err) {
            next(err);
        });
    },
    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var isExists = yield thunkQuery(RoleRights.select().where(_.pick(req.params, ['roleID', 'rightID'])));
            if (_.first(isExists)) {
                throw new HttpError(403, 106);
            }

            var Right = yield thunkQuery(Rights.select().where(Rights.id.equals(req.params.rightID)));
            if (!_.first(Right)) {
                throw new HttpError(400, 'This right does not exist');
            }

            var Role = yield thunkQuery(Roles.select().where(Roles.id.equals(req.params.roleID)));
            Role = _.first(Role);

            if (!Role) {
                throw new HttpError(400, 'This role does not exist');
            }

            if (Role && !Role.isSystem) {
                throw new HttpError(400, 'You can add right only to system roles. For simple roles use access matrices');
            }

            return yield thunkQuery(RoleRights.insert(_.pick(req.params, RoleRights.table._initialConfig.columns)));

        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'rolerights',
                entities: data,
                info: 'Add new right to role'
            });
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    },
    deleteOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                RoleRights.delete().where(_.pick(req.params, ['roleID', 'rightID']))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'rolerights',
                entities: _.pick(req.params, ['roleID', 'rightID']),
                info: 'Delete right from role'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
s    }

};
