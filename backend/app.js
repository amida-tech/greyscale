#!/usr/bin/env node

'use strict';

var spawn = require('child_process').spawn,
  _ = require('underscore'),
  test = (process.argv.length > 2 && process.argv[2] == 'test'),
  args = [],
  stdio = [];

if (test) {
  args = ['test/bootstrap.js'];
  stdio = [process.stdin, process.stdout, process.stderr];
} else {
  args = _.union(process.execArgv, ['app/bootstrap.js']);
  stdio = [process.stdin, process.stdout, process.stderr];
}

var opt = {
  cwd: __dirname,
  env: (function () {
    process.env.NODE_PATH = '.'; // Enables require() calls relative to the cwd
    if (test) {
      process.env.NODE_ENV = 'test';
    }
    return process.env;
  }()),
  stdio: stdio
};

var app = spawn(process.execPath, args, opt);

