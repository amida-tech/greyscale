if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

var config = require('../config'),
    multer = require('multer'),
    passport = require('passport'),
    util = require('util'),
    pg = require('pg'),
    fs = require('fs'),
    HttpError = require('./error').HttpError,
    Query = require('./util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),
    mc = require('./mc_helper'),
    co = require('co'),
    router = require('./router');

var debug = require('debug')('debug_bootstrap');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var app = require('express')();

app.on('start', function () {

    //Connect to memchache server
    var memcache = require('memcache');

    var mcClient = new memcache.Client(
        config.mc.port,
        config.mc.host
    );

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
    app.use(router);

    // Error number
    app.use(function (err, req, res, next) {
        if (typeof err === 'number') {
            next(new HttpError(err));
        } else {
            next(err);
        }
    });

    app.use(function(err, req, res, next) {
        if (process.env.NODE_ENV === 'development') {
            console.log(req);
        }
        next();
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

    pg.defaults.poolSize = 100;
    pg.connect(pgConString + '/' + pgDbName, function (err, client, done) {
        if (err) {
            debug('Could not connect to the database.');
        }
    });

    function startServer() {
        // Start server
        var server = app.listen(process.env.PORT || config.port || 3000, function () {
            debug('Listening on port ' + server.address().port);
            console.log('starting server..'); // need for background test server
        });

        require('./socket/socket-controller.server').init(server);
    }

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
