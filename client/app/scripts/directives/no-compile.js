'use strict';

angular.module('greyscaleApp')
    .directive('noCompile', function () {
        return {
            restrict: 'A',
            terminal: true
        };
    });
