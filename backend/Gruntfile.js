'use strict';

var fs = require('fs');
var homeDir = process.env.HOME;

module.exports = function (grunt) {

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Make sure there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '../.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js']
            }
        },

        // Make sure code styles are up to par
        jscs: {
            options: {
                config: '../.jscsrc',
                verbose: true
            },
            all: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js']
            }
        },

        jsbeautifier: {
            beautify: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js'],
                options: {
                    config: '../.jsbeautifyrc'
                }
            },
            check: {
                src: ['Gruntfile.js', 'lib/**/*.js', 'app/**/*.js'],
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '../.jsbeautifyrc'
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

                        ca: fs.readFileSync(homeDir + '/.docker/machine/certs/ca.pem'),
                        cert: fs.readFileSync(homeDir + '/.docker/machine/certs/cert.pem'),
                        key: fs.readFileSync(homeDir + '/.docker/machine/certs/key.pem')
                    }
                }
            }
        },

    });

    grunt.registerTask('buildDocker', [
        'dock:build'
    ]);

    grunt.registerTask('buildDockerMac', [
        'dock:osx:build'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'jscs',
        'jsbeautifier:check'
    ]);
};
