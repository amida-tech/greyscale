// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-11-09 using
// generator-karma 1.0.0

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      "jasmine"
    ],

    reporters: ['spec'],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'bower_components/ie8-node-enum/index.js',
      'bower_components/jquery/jquery.js',
      'bower_components/jquery-ui/ui/jquery-ui.js',
      'bower_components/jquery.scrollWindowTo/index.js',
      'bower_components/underscore/underscore.js',
      'bower_components/underscore.mixin.deepExtend/index.js',
      'bower_components/backbone/backbone.js',
      'bower_components/backbone-deep-model/src/deep-model.js',
      'bower_components/rivets/dist/rivets.js',
      'bower_components/formbuilder/dist/formbuilder.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-file-upload/dist/angular-file-upload.min.js',
      'bower_components/angular-inform/dist/angular-inform.js',
      'bower_components/angular-messages/angular-messages.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-translate/angular-translate.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-ui-sortable/sortable.js',
      'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js',
      'bower_components/d3/d3.js',
      'bower_components/c3/c3.js',
      'bower_components/isteven-angular-multiselect/isteven-multi-select.js',
      'bower_components/lodash/lodash.js',
      'bower_components/lodash-angular-wrapper/lodash-angular-wrapper.js',
      'bower_components/minigrid/src/index.js',
      'bower_components/ng-table/dist/ng-table.min.js',
      'bower_components/pivottable/dist/pivot.js',
      'bower_components/plotly.js/plotly.js',
      'bower_components/restangular/dist/restangular.js',
      'bower_components/socket.io-client/dist/socket.io.js',
      // endbower
      ".tmp/l10n/en.js",
      "app/greyscale.core/scripts/greyscale.core.js",
      "app/greyscale.core/**/*.js",
      "app/greyscale.mock/**/*.js",
      "app/greyscale.rest/**/*.js",
      "app/greyscale.tables/**/*.js",
      "app/scripts/app.js",
      "app/scripts/**/*.js",
      "app/vendors/rdash/module.js",
      "app/vendors/rdash/directives/loading.js",
      "app/vendors/rdash/directives/widget.js",
      "app/vendors/rdash/directives/widget-body.js",
      "app/vendors/rdash/directives/widget-footer.js",
      "app/vendors/rdash/directives/widget-header.js",
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      "Chrome"
    ],

    // Which plugins to enable
    plugins: [
      "karma-spec-reporter",
      "karma-chrome-launcher",
      "karma-jasmine"
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_WARN

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
