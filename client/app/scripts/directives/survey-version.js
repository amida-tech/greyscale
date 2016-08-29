/**
 * Created by igi on 29.08.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyVersion', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/survey-version.html'
        };
    });
