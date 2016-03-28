if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}

var config = require('config'),
    logger = require('app/logger'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    passport = require('passport'),
    util = require('util'),
    pg = require('pg'),
    fs = require('fs'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    _ = require('underscore'),
    Language = require('app/models/languages'),
    thunkQuery = thunkify(query),
    co = require('co');

app = require('express')();

// Init mongoose connection and set event listeners
//require('app/db_bootstrap')(app);

app.on('start', function () {
    
    app.use('/:realm',function(req, res, next){
        // realm not set
        var cpg = config.pgConnect;
        co(function*(){
            var schemas = yield thunkQuery(
                "SELECT pg_catalog.pg_namespace.nspname " +
                "FROM pg_catalog.pg_namespace " +
                "INNER JOIN pg_catalog.pg_user " +
                "ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid) " +
                "AND (pg_catalog.pg_user.usename = '" + cpg.user + "')"
            );
            req.schemas = [];
            for (var i in schemas) {
                if ([cpg.sceletonSchema, cpg.adminSchema].indexOf(schemas[i].nspname) == -1) {
                    req.schemas.push(schemas[i].nspname);
                }
            }
            if (req.params.realm != cpg.adminSchema && req.schemas.indexOf(req.params.realm) == -1) {
                throw new HttpError(400, "Namespace " + req.params.realm + " does not exist");
            }
            return req.params.realm;
        }).then(function(data){
            var query = new Query(data);
            req.thunkQuery = thunkify(query);
            next();
        }, function(err){
            next(err);
        });
    });

    // MEMCHACHE
    app.use(function(req,res,next){
        req.mcClient = mcClient;
        next();
    });

    // Init logger
    app.use(logger.initialize());

    // Init passport engine
    app.use(passport.initialize());

    // json pretty
    app.set('json spaces', 2);

    // Parse JSON requests using body-parser
    app.use(bodyParser.json());

    // form-data
    app.use(multer());

    // view engine
    app.engine('ejs', require('ejs-locals'));
    app.set('views', 'templates');
    app.set('view engine', 'ejs');

    //test
    //app.use(require('app/util').mongoose_options2);

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

    //app.all('*', function (req, res, next) {
    //    var acceptLanguage = require('accept-language');
    //    co(function*(){
    //        if (req.headers['accept-language'] === 'null') { // get 'null' if accept language not set
    //            var data = yield thunkQuery(
    //                Language.select().from(Language).where(Language.code.equals(config.defaultLang))
    //            );
    //
    //            console.log(data);
    //            req.lang = _.first(data);
    //
    //        } else {
    //            var languages = {};
    //            var data = yield thunkQuery(
    //                Language.select().from(Language)
    //            );
    //
    //            if(!data.length){
    //                throw new HttpError(400, 'You do not have any language record in DB, please provide some');
    //            }
    //
    //            for (var i in data) {
    //                languages[data[i].code] = data[i];
    //            }
    //
    //            acceptLanguage.languages(Object.keys(languages));
    //            var code = acceptLanguage.get(req.headers['accept-language']);
    //            req.lang = languages[code];
    //
    //        }
    //    }).then(function(){
    //        next();
    //    }, function(err){
    //        next(err);
    //    });
    //
    //});



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
        console.log(err);
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
                    req.debug(msg);
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
        logger.error(err.stack);
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
                    console.log(err);
                    return;
                }
                console.log('Attempting to create database.');
                // Create the DB if it is not there
                client.query('CREATE DATABASE ' + pgDbName, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    client.end();

                    // Load the schema if it is not there
                    pg.connect(pgConString + '/' + pgDbName, function (err, client, done) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        client.query(sql, function (err) {
                            if (err) {
                                console.log('Schema already initialized');
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
                    console.log(err);
                    console.log('Schema already initialized');
                }
                client.end();
            });
        }
    });

    function startServer() {
        // Start server
        var server = app.listen(process.env.PORT || config.port || 3000, function () {
            logger.info(util.format('Listening on port %d', server.address().port));
        });

        require('app/socket/socket-controller.server').init(server);
    }


    //Connect to memchache server
    var memcache = require('memcache');

    var mcClient = new memcache.Client(
        config.mc.port,
        config.mc.host
    );

    mcClient.on('connect', function(){
        console.log('mc connected');
        startServer();
    });

    mcClient.on('error', function(e){
        console.log('MEMCACHE ERROR');
        console.log(e);
    });

    mcClient.connect();




});

app.emit('start');

module.exports = app;
