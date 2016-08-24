var
    _ = require('underscore'),
    config = require('config'),
    common = require('app/services/common'),
    AsyncLock = require('async-lock'),
    Uoa = require('app/models/uoas'),
    UoaType = require('app/models/uoatypes'),
    Organization = require('app/models/organizations'),
    co = require('co'),
    Query = require('app/util').Query,
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    mc = require('app/mc_helper'),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_uoas_service');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var lock = new AsyncLock();

var exportObject = function  (req, realm) {

    var thunkQuery = thunkify(new Query(realm));
    if (!realm) {
        thunkQuery = req.thunkQuery;
    }

    this.createVirtualPolicySubject = function () {

        lock.acquire('newVirtualPolicySubject', function(done){
            var policyUoaType = config.pgConnect.policyUoaType || 'Policy';
            var policyUoaName = config.pgConnect.policyUoaName || '_Policy_';
            var policyUoaId, policyUoaTypeId;
            co(function* () {
                if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                    try {
                        policyUoaId = yield mc.get(req.mcClient, 'policyUoaId');
                    } catch (e) {
                        debug ('Error get policyUoaId from memcash server');
                        throw e;
                    }
                }

                if (!policyUoaId) {
                    var thunkQuery = req.thunkQuery;
                    // check policy virtual subject
                    policyUoaId = yield thunkQuery(Uoa
                            .select(Uoa.id)
                            .from(
                            Uoa
                                .leftJoin(UoaType)
                                .on(UoaType.id.equals(Uoa.unitOfAnalysisType))
                        )
                            .where(Uoa.name.equals(policyUoaName))
                            .and(UoaType.name.equals(policyUoaType))
                    );
                    if (_.first(policyUoaId)) {
                        debug('Policy virtual subject `' + policyUoaName + '` with type `' + policyUoaType + '` already exist');
                        policyUoaId = policyUoaId[0].id;
                    } else {
                        debug('Policy virtual subject id not defined yet');
                        policyUoaTypeId = yield thunkQuery(UoaType
                                .select(UoaType.id)
                                .from(UoaType)
                                .where(UoaType.name.equals(policyUoaType))
                        );
                        if (_.first(policyUoaTypeId)) {
                            debug('Policy virtual subject type `' + policyUoaType + '` exist');
                            policyUoaTypeId = policyUoaTypeId[0].id;
                        } else {
                            // create new uoaType for policy
                            debug('Create new policy virtual subject type: ' + policyUoaType);
                            policyUoaTypeId = yield thunkQuery(UoaType
                                    .insert({
                                        name: policyUoaType,
                                        description: 'Policy virtual subject type'
                                    })
                                    .returning(UoaType.id)
                            );
                            if (!_.first(policyUoaTypeId)) {
                                debug('Policy virtual subject type not created');
                                throw 'Policy virtual subject type not created';
                            }
                            policyUoaTypeId = policyUoaTypeId[0].id;
                        }
                        // check policy virtual subject
                        policyUoaId = yield thunkQuery(Uoa
                                .select(Uoa.id)
                                .from(Uoa)
                                .where(Uoa.name.equals(policyUoaName))
                                .and(Uoa.unitOfAnalysisType.equals(policyUoaTypeId))
                        );
                        if (_.first(policyUoaId)) {
                            debug('Policy virtual subject exist');
                            policyUoaId = policyUoaId[0].id;
                        } else {
                            // get organization admin user id
                            var adminUserId = yield thunkQuery(Organization
                                    .select(Organization.adminUserId)
                                    .from(Organization)
                            );
                             if (!_.first(adminUserId)) {
                                 debug('Error get admin user id for organization: `' + req.param.realm + '`');
                             }
                            adminUserId = _.first(adminUserId) ? adminUserId[0].adminUserId : null;
                            // create new virtual uoa (subject) for policy
                            debug('Create new policy virtual subject `' + policyUoaName + '`');
                            policyUoaId = yield thunkQuery(Uoa
                                    .insert({
                                        name: policyUoaName,
                                        unitOfAnalysisType: policyUoaTypeId,
                                        creatorId: adminUserId,
                                        ownerId: adminUserId
                                    })
                                    .returning(Uoa.id)
                            );
                            if (!_.first(policyUoaId)) {
                                debug('Policy virtual subject not created');
                                throw 'Policy virtual subject not created';
                            }
                            policyUoaId = _.first(policyUoaId) ? policyUoaId[0].id : null;
                        }
                    }
                    if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                        try {
                            policyUoaId = yield mc.set(req.mcClient, 'policyUoaId', policyUoaId, 60);
                        } catch (e) {
                            debug ('Error set policyUoaId from memcash server');
                            throw e;
                        }
                    }
                }

            }).then(function () {
                done(null);
            }, function (err) {
                done(err);
            });
        }, function(err, ret){
            // lock released
            if (err) {
                debug('Error when creating virtual policy subject: ' + err);
            }
        });
    };
};
module.exports = exportObject;
