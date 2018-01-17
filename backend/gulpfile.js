const gulp = require('gulp');
const plato = require('es6-plato');
const lintRules = require('./.eslintrc')

const appSrc = './app/**';
const testSrc = './test/**';

const appOutputDir = './artifacts/app';
const testOutputDir = './artifacts/test';

const complexityRules = {};

const platoArgs = {
    title: 'GreyScale Code Analysis',
    eslint: lintRules,
    complexity: complexityRules,
};

function analysis() {
    return plato.inspect(appSrc, appOutputDir, platoArgs);
}

function testAnalysis() {
    return plato.inspect(testSrc, testOutputDir, platoArgs);
}

gulp.task('appAnalysis', analysis);
gulp.task('testAnalysis', testAnalysis);
