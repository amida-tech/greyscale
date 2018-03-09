'use strict';

const express = require('express');
const co = require('co');
const thunkify = require('thunkify');
const multer = require('multer');
const passport = require('passport');
const pg = require('pg');
const memcache = require('memcache');

const config = require('../config');
const logger = require('./logger');
const router = require('./router');
const mc = require('./mc_helper');
const HttpError = require('./error').HttpError;
const Query = require('./util').Query;

const query = new Query();
const thunkQuery = thunkify(query);

const newExpress = function () {
    const app = express();
    return app;
};

const messageService = require('./services/messages');

const initExpress = function (app) {
    const startServer = function () {
        return messageService.authAsSystemMessageUser()
        .then((response) => {
            app.set(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD, response.token)
            logger.debug('Authenticated as system message user');
        }).catch((err) => {
            logger.error('Failed to authenticate as system message user');
            logger.error(`Expected a system message user (${config.systemMessageUser} to exist.)`);
            logger.error('Expected to authenticate with password in SYS_MESSAGE_PASSWORD');
            logger.error(err);
        }).then(() => {
            var server = app.listen(process.env.PORT || config.port || 3000, function () {
                logger.debug('Listening on port ' + server.address().port);
                console.log('ok, server is running!'); // need for background test server
            });

            require('./socket/socket-controller.server').init(server);
        });
    };

    // MEMCHACHE
    var mcClient = new memcache.Client(
        config.mc.port,
        config.mc.host
    );

    mcClient.on('connect', function () {
        logger.debug('mc connected');
        startServer();
    });

    mcClient.on('error', function (e) {
        logger.error('MEMCACHE ERROR');
        logger.debug(e);
    });

    app.locals.mcClient = mcClient; // eslint-disable-line no-param-reassign

    app.use(function (req, res, next) {
        logger.debug('Request URL:', req.url);
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

    // Setup error handlers
    app.use(function (err, req, res) {
        if (err) {
            const message = err.message;
            logger.error(err);
            switch (err.name) {
            case 'HttpError':
                var status = err.status || 400;
                res.status(status).json(err.message);
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
                    logger.debug(msg);
                    res.json(400, {
                        error: msg
                    }); // Bad request
                    return;
                }
            }
            if (message) {
                res.status(400).json({ message });
                return;
            }
        }
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
    logger.debug(`pg connec string: ${pgConString}`);
    pg.defaults.poolSize = 100;
    pg.connect(pgConString + '/' + pgDbName, function (err, client, done) {
        if (err) {
            return logger.debug('Could not connect to the database.');
        }
        logger.debug('Was able to connect to the database.');
        done();
    });
};

const generate = function () {
    const app = newExpress();
    initExpress(app);
    return app;
};

module.exports = {
    generate,
};
