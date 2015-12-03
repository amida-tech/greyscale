/**
 * Created by igi on 03.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('boardTable', function () {
        return {
            restrict: 'AE',
            templateUrl: 'views/directives/widget-table.html',
            scope: {
                model: '='
            }
        };
    });
