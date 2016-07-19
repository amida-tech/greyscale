#!/usr/bin/env node

'use strict';

var spawn = require('child_process').spawn,
    _ = require('underscore'),
    args = [],
    stdio = [];

args = _.union(process.execArgv, ['app/bootstrap.js']);
stdio = [process.stdin, process.stdout, process.stderr];

var opt = {
  cwd: __dirname,
  stdio: stdio
};

var app = spawn(process.execPath, args, opt);

var children = [];
process.on('SIGTERM', function() {
    children.forEach(function(child) {
        child.kill();
    });
});

children.push(app);

