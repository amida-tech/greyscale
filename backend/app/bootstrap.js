if (process.env.NODE_ENV == 'production') {
  require('newrelic');
}

var config = require('config'),
  logger = require('app/logger'),
  bodyParser = require('body-parser'),
  multer = require('multer'),
  passport = require('passport'),
  app = require('express')(),
  util = require('util'),
  HttpError = require('app/error').HttpError;

// Init mongoose connection and set event listeners
//require('app/db_bootstrap')(app);

app.on('start', function () {

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
    if (typeof err == 'number') {
      next(new HttpError(err));
    }
    else {
      next(err);
    }
  });

  // Setup error handlers
  app.use(function (err, req, res, next) {
    console.log(err)
    if (err) switch (err.name) {
      case 'HttpError':
        res.status(400).json(err.message);
        return;
      case 'error':
        res.status(400).json({
          "!": 0,
          "e": err.code,
          "message": err.message
        });
        return;
      case 'SyntaxError':
        if (err.status == 400) {
          var msg = 'Malformed JSON';
          req.debug(msg);
          res.json(400, { error: msg }); // Bad request
          return;
        }
    }
    logger.error(err.stack);
    res.sendStatus(500);

  });

  // Start server
  var server = app.listen(process.env.PORT || config.port || 3000, function () {
    logger.info(util.format('Listening on port %d', server.address().port));
  });

});

app.emit('start');

module.exports = app;

