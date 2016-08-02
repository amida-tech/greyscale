if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

var config = require('config'),
    multer = require('multer'),
    passport = require('passport'),
    util = require('util'),
    pg = require('pg'),
    fs = require('fs'),
    Uoa = require('app/models/uoas'),
    UoaType = require('app/models/uoatypes'),
    Organization = require('app/models/organizations'),
    _ = require('underscore'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    mc = require('app/mc_helper'),
    co = require('co');

var debug = require('debug')('debug_bootstrap');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var app = require('express')();

app.on('start', function () {

    // MEMCHACHE
    app.use(function (req, res, next) {
        debug('Request URL:', req.url);
        req.mcClient = mcClient;
        next();
    });

    app.use('/:realm', function (req, res, next) {
        // realm not set
        var cpg = config.pgConnect;
        var schemas;
        co(function* () {
            if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                try {
                    schemas = yield mc.get(req.mcClient, 'schemas');
                } catch (e) {
                    throw new HttpError(500, e);
                }
            }

            if (schemas) {
                req.schemas = schemas.split(',');
            } else {
                schemas = yield thunkQuery(
                    'SELECT pg_catalog.pg_namespace.nspname ' +
                    'FROM pg_catalog.pg_namespace ' +
                    'INNER JOIN pg_catalog.pg_user ' +
                    'ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid) ' +
                    'AND (pg_catalog.pg_user.usename = \'' + cpg.user + '\')'
                );
                req.schemas = [];
                for (var i in schemas) {
                    if ([cpg.sceletonSchema, cpg.adminSchema].indexOf(schemas[i].nspname) === -1) {
                        req.schemas.push(schemas[i].nspname);
                    }
                }
                if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                    try {
                        schemas = yield mc.set(req.mcClient, 'schemas', req.schemas, 60);
                    } catch (e) {
                        throw new HttpError(500, e);
                    }
                }
            }

            if (req.params.realm !== cpg.adminSchema && req.schemas.indexOf(req.params.realm) === -1) {
                throw new HttpError(400, 'Namespace ' + req.params.realm + ' does not exist');
            }
            return req.params.realm;
        }).then(function (data) {
            var query = new Query(data);
            req.thunkQuery = thunkify(query);
            next();
        }, function (err) {
            next(err);
        });
    });

    // Initialize subject for policy if needed
    app.use('/:realm', function (req, res, next) {
        if (req.params.realm === config.pgConnect.adminSchema) {
            next();
            return;
        }
        var policyUoaType = config.pgConnect.policyUoaType || 'Policy';
        var policyUoaName = config.pgConnect.policyUoaName || '_Policy_';
        var policyUoaId, policyUoaTypeId;
        co(function* () {
            if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                try {
                    policyUoaId = yield mc.get(req.mcClient, 'policyUoaId');
                } catch (e) {
                    throw new HttpError(500, e);
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
                            throw new HttpError(500, 'Error creating policy virtual subject type');
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
                            throw new HttpError(500, 'Error get admin user id for organization: `' + req.param.realm + '`');
                        }
                        adminUserId = adminUserId[0].adminUserId;
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
                            throw new HttpError(500, 'Error creating policy virtual subject');
                        }
                        policyUoaId = policyUoaId[0].id;
                    }
                }
                if (process.env.BOOTSTRAP_MEMCACHED !== 'DISABLE') {
                    try {
                        policyUoaId = yield mc.set(req.mcClient, 'policyUoaId', policyUoaId, 60);
                    } catch (e) {
                        throw new HttpError(500, e);
                    }
                }
            }

            return policyUoaId;
        }).then(function (data) {
            req.policyUoa = data;
            next();
        }, function (err) {
            next(err);
        });
    });

    // multipart form-data
    // keep above logger to avoid obscure crashes
    app.use(multer());

    // Init passport engine
    app.use(passport.initialize());

    // json pretty
    app.set('json spaces', 2);

    // Set headers for CORS
    app.use(function (req, res, next) {
        req.lang = {
            id: 1
        };
        res.header('Access-Control-Allow-Origin', config.allowedDomains);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,token');
        res.header('Access-Control-Expose-Headers', 'X-Total-Count');
        next();
    });

    // Route requests to controllers/actions
    app.use(require('app/router'));

    // Error number
    app.use(function (err, req, res, next) {
        if (typeof err === 'number') {
            next(new HttpError(err));
        } else {
            next(err);
        }
    });

    // Setup error handlers
    app.use(function (err, req, res, next) {
        error(JSON.stringify(err));
        if (err) {
            switch (err.name) {
            case 'HttpError':
                res.status(400).json(err.message);
                return;
            case 'error':
                res.status(400).json({
                    '!': 0,
                    'e': err.code,
                    'message': err.message
                });
                return;
            case 'SyntaxError':
                if (err.status === 400) {
                    var msg = 'Malformed JSON';
                    debug(msg);
                    res.json(400, {
                        error: msg
                    }); // Bad request
                    return;
                }
            }
            if (err.message) {
                res.status(400).json(err.message);
                return;
            }
        }
        debug(err.stack);
        res.sendStatus(500);
    });

    /*
     * Bootstrap the Postgres DB
     */
    var pgUser = config.pgConnect.user,
        pgPassword = config.pgConnect.password,
        pgHost = config.pgConnect.host,
        pgPort = config.pgConnect.port,
        pgDbName = config.pgConnect.database;

    var pgConString = 'postgres://' + pgUser + ':' + pgPassword + '@' + pgHost + ':' + pgPort;

    var sql = fs.readFileSync('db_dump/schema.sql').toString().replace(/POSTGRES_USER/g, pgUser);
    pg.defaults.poolSize = 100;
    pg.connect(pgConString + '/' + pgDbName, function (err, client, done) {

        if (err) {
            //If the DB already exists then do not attempt to connect to postgres.
            //This avoids problems where the user performing the connection may not have access
            //to the postgres admin database.  Odds are high however if they do not have access
            //to the admin database they also will not have access to create new databases.

            //we failed to connect to the database, so attempt to connect to
            //the admin database
            pg.connect(pgConString + '/postgres', function (err, client, done) {
                if (err) {
                    error(err);
                    return;
                }
                debug('Attempting to create database.');
                // Create the DB if it is not there
                client.query('CREATE DATABASE ' + pgDbName, function (err) {
                    if (err) {
                        error(err);
                    }
                    client.end();

                    // Load the schema if it is not there
                    pg.connect(pgConString + '/' + pgDbName, function (err, client, done) {
                        if (err) {
                            error(err);
                            return;
                        }
                        client.query(sql, function (err) {
                            if (err) {
                                error('Schema already initialized');
                            }
                            client.end();
                        });
                    });

                });
            });
        } else {
            //database already exists so try to initialize the schema.
            client.query(sql, function (err) {
                if (err) {
                    error(err);
                    debug('Schema already initialized');
                }
                client.end();
            });
        }
    });

    function startServer() {
        // Start server
        var server = app.listen(process.env.PORT || config.port || 3000, function () {
            debug('Listening on port ' + server.address().port);
            console.log('starting server..'); // need for background test server
        });

        require('app/socket/socket-controller.server').init(server);
    }

    //Connect to memchache server
    var memcache = require('memcache');

    var mcClient = new memcache.Client(
        config.mc.port,
        config.mc.host
    );

    mcClient.on('connect', function () {
        debug('mc connected');
        startServer();
    });

    mcClient.on('error', function (e) {
        error('MEMCACHE ERROR');
        debug(e);
    });

    mcClient.connect();

});

app.emit('start');

module.exports = app;
