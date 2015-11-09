var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

suites = ['test/models', 'test/restapi'];

var mochaOptions = {
  reporter: 'spec'
};

var mochas = []; // Mocha instances. Instance per suite.

suites.forEach(function(suite) {
  var mocha = new Mocha(mochaOptions);
  fs.readdirSync(suite).filter(function(fname) {
    return fname.substr(-3) === '.js'; // only .js files
  }).forEach(function(fname) {
    mocha.addFile(path.join(suite, fname));
  });
  mochas.push(mocha);
});

// Each suite running in separete Mocha instance in series.
async.mapSeries(
  mochas,
  function(mocha, callback) {
    mocha.run(function(failures) {
      if (failures > 0) {
        callback(new Error('Test suite failed'));
      } else {
        callback(null, failures);
      }
    });
  },
  function(err, results) {
    if (err) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
);

