// Generated on 2015-11-09 using generator-angular 0.14.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'
var fs = require('fs');
var homeDir = process.env.HOME;

module.exports = function (grunt) {

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin',
        ngtemplates: 'grunt-angular-templates',
        //cdnify: 'grunt-google-cdn',
        ngconstant: 'grunt-ng-constant'
    });

    // Configurable paths for the application
    var appConfig = {
        app: require('./bower.json').appPath || 'app',
        dist: 'dist'
    };

    var dockerConfig = {
        ca: '',
        cert: '',
        key: ''
    };

    if (process.platform === 'darwin') {
        try {
            dockerConfig.ca = fs.readFileSync(homeDir + '/.docker/machine/certs/ca.pem');
            dockerConfig.cert = fs.readFileSync(homeDir + '/.docker/machine/certs/cert.pem');
            dockerConfig.key = fs.readFileSync(homeDir + '/.docker/machine/certs/key.pem');
        } catch (error) {}
    }

    var i18nConfig = {
        i18nDir: 'i18n',
        l10nDir: 'l10n',
        supportedLocales: ['en', 'ru']
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            js: {
                files: [
                    '<%= yeoman.app %>/scripts/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.core/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.rest/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.tables/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.mock/{,**/}*.js'
                ],
                tasks: ['newer:jshint:all', 'newer:jscs:all'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['newer:jshint:test', 'newer:jscs:test', 'karma']
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                tasks: ['compass:server', 'postcss:server']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            i18n: {
                files: [i18nConfig.i18nDir + '/*.json'],
                tasks: ['i18n'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 8081,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect) {
                        return [
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect().use(
                                '/app/styles',
                                connect.static('./app/styles')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9001,
                    middleware: function (connect) {
                        return [
                            connect.static('.tmp'),
                            connect.static('test'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= yeoman.dist %>'
                }
            }
        },

        // Make sure there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '../.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/vendors/{,*/}*.js',
                    '<%= yeoman.app %>/greyscale.core/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.rest/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.tables/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.mock/{,**/}*.js'
                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Make sure code styles are up to par
        jscs: {
            options: {
                config: '../.jscsrc',
                verbose: true
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/vendors/{,*/}*.js',
                    '<%= yeoman.app %>/greyscale.core/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.rest/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.tables/{,**/}*.js'
                ]
            },
            test: {
                src: ['test/spec/{,*/}*.js']
            }
        },

        jsbeautifier: {
            beautify: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/vendors/{,*/}*.js',
                    '<%= yeoman.app %>/greyscale.core/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.rest/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.tables/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.mock/{,**/}*.js'
                ],
                options: {
                    config: '../.jsbeautifyrc'
                }
            },
            check: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/vendors/{,*/}*.js',
                    '<%= yeoman.app %>/greyscale.core/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.rest/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.tables/{,**/}*.js',
                    '<%= yeoman.app %>/greyscale.mock/{,**/}*.js'
                ],
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '../.jsbeautifyrc'
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Add vendor prefixed styles
        postcss: {
            options: {
                processors: [
                    require('autoprefixer-core')({
                        browsers: ['last 1 version']
                    })
                ]
            },
            server: {
                options: {
                    map: true
                },
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            }
        },

        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['<%= yeoman.app %>/index.html'],
                ignorePath: /\.\.\//
            },
            test: {
                devDependencies: true,
                src: '<%= karma.unit.configFile %>',
                ignorePath: /\.\.\//,
                fileTypes: {
                    js: {
                        block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
                        detect: {
                            js: /'(.*\.js)'/gi
                        },
                        replace: {
                            js: '\'{{filePath}}\','
                        }
                    }
                }
            },
            sass: {
                src: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                ignorePath: /(\.\.\/){1,2}bower_components\//
            }
        },

        // Compiles Sass to CSS and generates necessary files if requested
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                generatedImagesDir: '.tmp/images/generated',
                imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: '<%= yeoman.app %>/scripts',
                fontsDir: '<%= yeoman.app %>/styles/fonts',
                importPath: './bower_components',
                httpImagesPath: '/images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: '/styles/fonts',
                relativeAssets: false,
                assetCacheBuster: false,
                raw: 'Sass::Script::Number.precision = 10\n'
            },
            dist: {
                options: {
                    generatedImagesDir: '<%= yeoman.dist %>/images/generated'
                }
            },
            server: {
                options: {
                    sourcemap: true
                }
            }
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= yeoman.dist %>/scripts/{,*/}*.js',
                    '<%= yeoman.dist %>/styles/{,*/}*.css',
                    '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= yeoman.dist %>/styles/fonts/*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            js: ['<%= yeoman.dist %>/scripts/{,*/}*.js'],
            options: {
                assetsDirs: [
                    '<%= yeoman.dist %>',
                    '<%= yeoman.dist %>/images',
                    '<%= yeoman.dist %>/styles'
                ],
                patterns: {
                    js: [
                        [/(images\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))/g, 'Replacing references to images']
                    ]
                }
            }
        },

        // The following *-min tasks will produce minified files in the dist folder
        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        // cssmin: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/styles/main.css': [
        //         '.tmp/styles/{,*/}*.css'
        //       ]
        //     }
        //   }
        // },
        // uglify: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/scripts/scripts.js': [
        //         '<%= yeoman.dist %>/scripts/scripts.js'
        //       ]
        //     }
        //   }
        // },
        // concat: {
        //   dist: {}
        // },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: false,
                    removeCommentsFromCDATA: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['*.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        ngtemplates: {
            dist: {
                options: {
                    module: 'greyscaleApp',
                    htmlmin: '<%= htmlmin.dist.options %>',
                    usemin: 'scripts/scripts.js'
                },
                cwd: '<%= yeoman.app %>',
                src: 'views/{,*/}*.html',
                dest: '.tmp/templateCache.js'
            }
        },

        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/scripts',
                    src: '*.js',
                    dest: '.tmp/concat/scripts'
                }]
            }
        },

        // Replace Google CDN references
        /*
         cdnify: {
         dist: {
         html: ['<%= yeoman.dist %>/*.html']
         }
         },
         */

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'images/{,*/}*.{webp}',
                        'styles/fonts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }, {
                    expand: true,
                    cwd: '.tmp/' + i18nConfig.l10nDir,
                    dest: '<%= yeoman.dist %>/' + i18nConfig.l10nDir,
                    src: ['**/*.js']
                }, {
                    expand: true,
                    cwd: '.tmp/concat',
                    src: 'scripts/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bootstrap-sass-official/assets/fonts/bootstrap/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/font-awesome/fonts/*',
                    dest: '<%= yeoman.dist %>'
                }]
            },
            // temporary while imagemin is broken
            images: {
                expand: true,
                cwd: '<%= yeoman.app %>/images',
                src: '{,*/}*.{png,jpg,jpeg,gif}',
                dest: '<%= yeoman.dist %>/images'
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            l10n: {
                expand: true,
                cwd: i18nConfig.i18nDir + '/' + i18nConfig.l10nDir,
                dest: '.tmp/' + i18nConfig.l10nDir + '/',
                src: '**/*.*'
            },
            docker: {
                expand: true,
                cwd: '',
                dest: 'app/greyscale.core/scripts/config/',
                src: 'greyscale-env.js'
            },
            dev: {
                src: 'dev-Dockerrun.aws.json',
                dest: 'Dockerrun.aws.json',
            },
            stage: {
                src: 'staging-Dockerrun.aws.json',
                dest: 'Dockerrun.aws.json',
            },
            prod: {
                src: 'prod-Dockerrun.aws.json',
                dest: 'Dockerrun.aws.json',
            },
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'compass:server'
            ],
            test: [
                'compass'
            ],
            dist: [
                'compass:dist',
                // 'imagemin',
                'svgmin'
            ]
        },

        //ngconstant app settings
        ngconstant: {
            // Options for all targets
            options: {
                name: 'greyscale.core',
                deps: false,
                dest: '<%= yeoman.app %>/greyscale.core/scripts/config/greyscale-env.js'
            },
            // Environment targets
            local: {
                options: {},
                constants: {
                    greyscaleEnv: {
                        name: 'local',
                        apiProtocol: 'http',
                        apiHostname: 'localhost',
                        apiPort: '3005',
                        apiRealm: 'local',
                        apiVersion: 'v0.2',
                        enableDebugLog: true
                    }
                }
            },
            env: {
                options: {},
                constants: {
                    greyscaleEnv: {
                        name: 'env',
                        apiProtocol: process.env.SERVICE_PROTOCOL,
                        apiHostname: process.env.SERVICE_HOST,
                        apiPort: process.env.SERVICE_PORT,
                        apiRealm: process.env.SERVICE_REALM,
                        apiVersion: process.env.SERVICE_VER,
                        enableDebugLog: false
                    }
                }
            },
            dev: {
                options: {},
                constants: {
                    greyscaleEnv: {
                        supportedLocales: ['en', 'ru'],
                        name: 'dev',
                        apiProtocol: 'http',
                        apiHostname: 'indaba.ntrlab.ru',
                        apiPort: '83',
                        apiRealm: 'dev',
                        apiVersion: 'v0.2',
                        defaultUser: 'su@mail.net',
                        defaultPassword: 'testuser',
                        enableDebugLog: true
                    }
                }
            }
        },

        dock: {
            options: {
                docker: {
                    // docker connection
                    // See Dockerode for options
                    socketPath: '/var/run/docker.sock'
                },

                // It is possible to define images in the 'default' grunt option
                // The command will look like 'grunt dock:build'
                images: {
                    'amidatech/greyscale-client': { // Name to use for Docker
                        dockerfile: './',
                        options: {
                            build: { /* extra options to docker build   */ },
                            create: { /* extra options to docker create  */ },
                            start: { /* extra options to docker start   */ },
                            stop: { /* extra options to docker stop    */ },
                            kill: { /* extra options to docker kill    */ },
                            logs: { /* extra options to docker logs    */ },
                            pause: { /* extra options to docker pause   */ },
                            unpause: { /* extra options to docker unpause */ }
                        }
                    }
                }
            },
            osx: {
                options: {
                    docker: {
                        protocol: 'https',
                        host: '192.168.99.100',
                        port: '2376',

                        ca: dockerConfig.ca,
                        cert: dockerConfig.cert,
                        key: dockerConfig.key
                    }
                }
            }
        },

        // Test settings
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        },

        compress: {
            main: {
                options: {
                    archive: 'latest-client.zip'
                },
                src: 'Dockerrun.aws.json'
            }
        },

        awsebtdeploy: {
            options: {
                region: 'us-west-2',
                applicationName: 'greyscale',
                sourceBundle: 'latest-client.zip',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                versionLabel: 'client-' + Date.now(),
                s3: {
                    bucket: 'amida-greyscale'
                }
            },
            dev: {
                options: {
                    environmentName: 'greyscale-client-dev',
                }
            },
            stage: {
                options: {
                    environmentName: 'greyscale-client-stage',
                }
            },
            prod: {
                options: {
                    environmentName: 'greyscale-client-prod',
                }
            }
        }

    });

    grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'wiredep',
            'concurrent:server',
            'postcss:server',
            'i18n',
            'copy:l10n',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'wiredep',
        'concurrent:test',
        'postcss',
        'connect:test',
        'karma'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'wiredep',
        'useminPrepare',
        'concurrent:dist',
        'postcss',
        'ngtemplates',
        'concat',
        'ngAnnotate',
        'i18n',
        'copy:l10n',
        'copy:dist',
        'copy:images',
        //'cdnify',
        'cssmin',
        //'uglify',
        'filerev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('buildDev', [
        'ngconstant:dev',
        'build'
    ]);

    grunt.registerTask('buildLocal', [
        'ngconstant:local',
        'build'
    ]);

    grunt.registerTask('buildDocker', [
        'copy:docker',
        'build',
        'dock:build'
    ]);

    grunt.registerTask('buildDockerMac', [
        'copy:docker',
        'build',
        'dock:osx:build'
    ]);

    grunt.registerTask('buildEnv', [
        'ngconstant:env',
        'build'
    ]);

    grunt.registerTask('ebsDev', [
        'copy:dev',
        'compress',
        'awsebtdeploy:dev'
    ]);
    grunt.registerTask('ebsStage', [
        'copy:stage',
        'compress',
        'awsebtdeploy:stage'
    ]);
    grunt.registerTask('ebsProd', [
        'copy:prod',
        'compress',
        'awsebtdeploy:prod'
    ]);

    grunt.registerTask('brushIt', [
        'jshint:all',
        'jscs:all',
        'jsbeautifier:beautify'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'newer:jscs',
        'jsbeautifier:check',
        'test',
        'build'
    ]);

    grunt.registerTask('i18n', 'Generating js lang files from json sources with fallback to default lang', function i18nTask() {

        if (i18nTask.lock) {
            return;
        }

        i18nTask.lock = true;

        var done = this.async();

        var i18nDir = i18nConfig.i18nDir;
        var serveL10nDir = '.tmp/' + i18nConfig.l10nDir;

        grunt.file.mkdir(serveL10nDir);

        var supportedLocales = i18nConfig.supportedLocales;

        var count = 0;
        for (var i = 0; i < supportedLocales.length; i++) {
            count++;
            _processLocale(supportedLocales[i]);
        }

        //////////////////////////

        function _processLocale(locale) {
            _generateL10n(locale, function (locale, normSrc) {
                _normalizeSrc(locale, normSrc, function () {
                    count--;
                    if (count === 0) {
                        setTimeout(function () {
                            done();
                            i18nTask.lock = false;
                        }, 200);
                    }
                });
            });
        }

        function _generateL10n(locale, callback) {
            var normSrc, src;
            if (!_generateL10n.defaultSrc) {
                src = normSrc = _generateL10n.defaultSrc = _readSource(locale);
            } else {
                normSrc = _readSource(locale);
                src = _applyFallback(normSrc, _generateL10n.defaultSrc, locale);
            }
            _writeI18n(locale, src, function () {
                callback(locale, normSrc);
            });
        }

        function _applyFallback(src, fallback) {
            if (typeof fallback !== 'object') {
                return fallback;
            }
            if (typeof src !== 'object') {
                src = {};
            }
            var fallenSrc = {};
            for (var fname in fallback) {
                var fvalue = fallback[fname];
                var isObject = typeof fvalue === 'object';
                if (src[fname] === undefined) {
                    src[fname] = isObject ? {} : '';
                }
                if (isObject) {
                    fallenSrc[fname] = _applyFallback(src[fname], fvalue);
                } else {
                    fallenSrc[fname] = src[fname] !== '' ? src[fname] : fvalue;
                }
            }
            for (var sname in src) {
                if (fallback[sname] === undefined) {
                    delete src[sname];
                }
            }
            return fallenSrc;
        }

        function _writeI18n(locale, src, callback) {
            var file = _getDestFileName(locale);
            var content = 'L10N(\'' + locale + '\', ' + JSON.stringify(_sortObject(src), null, 2) + ');\n';
            fs.writeFile(file, content, callback);
        }

        function _normalizeSrc(locale, src, callback) {
            var file = _getSrcFileName(locale);
            var content = JSON.stringify(_sortObject(src), null, 4);
            fs.writeFile(file, content, callback);
        }

        function _readSource(locale) {
            var file = _getSrcFileName(locale);
            var src = grunt.file.readJSON(file);
            return JSON.parse(JSON.stringify(src));
        }

        function _getSrcFileName(locale) {
            return i18nDir + '/' + locale + '.json';
        }

        function _getDestFileName(locale) {
            return serveL10nDir + '/' + locale + '.js';
        }

        function _sortObject(o) {
            var ordered = {};
            Object.keys(o).sort().forEach(function (key) {
                ordered[key] = (typeof o[key] === 'object') ? _sortObject(o[key]) : o[key];
            });
            return ordered;
        }
    });
};
