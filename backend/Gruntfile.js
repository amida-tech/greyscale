'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var homeDir = process.env.HOME;

var sql = 'test/testdb.sql';

module.exports = function (grunt) {

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        express: 'grunt-express-server'
    });

    var dockerConfig = {
        ca: '',
        cert: '',
        key: ''
    };

    if (process.platform === 'darwin') {
        dockerConfig.ca = fs.readFileSync(homeDir + '/.docker/machine/certs/ca.pem');
        dockerConfig.cert = fs.readFileSync(homeDir + '/.docker/machine/certs/cert.pem');
        dockerConfig.key = fs.readFileSync(homeDir + '/.docker/machine/certs/key.pem');
    }

    // Define the configuration for all the tasks

    grunt.initConfig({

        env: {
            test: {
                NODE_ENV: 'test',
            }
        },

        // run test server
        express: {
            test: {
                options: {
                    harmony: true,
                    // jscs:disable
                    node_env: 'test',
                    // jscs:enable
                    script: 'app.js',
                    //debug: true,
                    port: 3006
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    timeout: '10000'
                },
                src: [
                    'test/**/1*.spec.js',
                    'test/**/2_*.spec.js',
                    'test/**/0*.spec.js',
                    'test/**/3_*.spec.js',
                    'test/**/71*.spec.js',
                    'test/**/72*.spec.js',
                    'test/**/73*.spec.js',
                    'test/**/74*.spec.js',
                    'test/**/81*.spec.js',
                    'test/**/82*.spec.js',
                    'test/**/83*.spec.js',
                    'test/**/91*.spec.js',
                    'test/**/92*.spec.js',
                    'test/**/93*.spec.js',
                    'test/**/94*.spec.js',
                    'test/**/95*.spec.js',
                ]
            }
        },

        // Make sure there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '../.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js', 'test/**/*.js']
            }
        },

        // Make sure code styles are up to par
        jscs: {
            options: {
                config: '../.jscsrc'
            },
            all: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js', 'test/**/*.js']
            }
        },

        // Make sure code formatting is beautiful
        jsbeautifier: {
            beautify: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js', 'test/**/*.js'],
                options: {
                    config: '../.jsbeautifyrc'
                }
            },
            check: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js', 'test/**/*.js'],
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '../.jsbeautifyrc'
                }
            }
        },

        // Perform Docker actions via Grunt
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
                    'amidatech/greyscale-backend': { // Name to use for Docker
                        dockerfile: './',
                        options: {
                            build: {
                                q: true
                            },
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

        copy: {
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

        // Compress the EBS Dockerrun file
        compress: {
            main: {
                options: {
                    archive: 'latest-backend.zip'
                },
                src: 'Dockerrun.aws.json'
            }
        },

        // Tasks for Elastic Beanstalk deployment
        awsebtdeploy: {
            options: {
                region: 'us-west-2',
                applicationName: 'indaba',
                sourceBundle: 'latest-backend.zip',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                versionLabel: 'backend-' + Date.now(),
                s3: {
                    bucket: 'amida-indaba'
                }
            },
            dev: {
                options: {
                    environmentName: 'indaba-backend-memcached-dev',
                }
            },
            stage: {
                options: {
                    environmentName: 'indaba-backend-memcached-stage',
                }
            },
            prod: {
                options: {
                    environmentName: 'indaba-backend-prod',
                }
            }
        }

    });

    // Postgres helper tasks for testing
    grunt.registerTask('createDatabase', function () {
        var done = this.async();
        var cpg = require('./config').pgConnect;
        console.log(cpg);
        var connectStringPg = ' -w -h ' + cpg.host + ' -U ' + cpg.testuser;
        exec('createdb ' + connectStringPg + ' ' + cpg.database, function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
                return done();
            }
            exec('psql ' + connectStringPg + ' -d ' + cpg.database + ' -f ' + sql, function (err) {
                if (err !== null) {
                    console.log('exec error: ' + err);
                }
                done();
            });
        });
    });

    grunt.registerTask('dropDatabase', function () {
        var done = this.async();
        var cpg = require('./config').pgConnect;
        var connectStringPg = ' -w -h ' + cpg.host + ' -U ' + cpg.testuser;
        exec('dropdb ' + connectStringPg + ' ' + cpg.database, function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }
            done();
        });
    });

    grunt.registerTask('bckpDb', function () {
        var done = this.async();
        var cpg = require('./config').pgConnect;
        var dbToCopy = 'indaba_clean'; // cpg.database;
        var connectStringPg = ' -h ' + cpg.host + ' -U ' + cpg.user + ' -W ' + dbToCopy;
        var filename = sql; // test/testdb.sql
        console.log(connectStringPg);
        exec('pg_dump ' + connectStringPg + ' > ' + filename, function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }
            done();
        });
    });

    grunt.registerTask('runTestServer', function () {
        var done = this.async();
        exec('DEBUG=* node --harmony app.js', function (err) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }
            done();
        });
    });

    grunt.registerTask('buildDocker', [
        'dock:build'
    ]);

    grunt.registerTask('buildDockerMac', [
        'dock:osx:build'
    ]);

    /*
     * Used for deploying the dev version of Indaba
     * to Elastic Beanstalk via Jenkins
     * - Copy the dev-Dockerrun file to Dockerrun.aws.json
     * - Zip the Dockerrun
     * - Run the EBS deploy grunt task
     */
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

    grunt.registerTask('test', [
        'env:test',
        //'bckpDb',
        'dropDatabase',
        'createDatabase',
        //'runTestServer',
        'express:test',
        'mochaTest'
    ]);

    grunt.registerTask('jsbeatifier-beautify', [
        'jsbeautifier:beautify'
    ]);
    /*
     * Default grunt task.
     * - Run the linter
     * - Run the style checker
     * - Run the beautifier
     * - Run unit tests
     */
    grunt.registerTask('default', [
        'jshint',
        'jscs',
        'jsbeautifier:check',
        'test'
    ]);
};
