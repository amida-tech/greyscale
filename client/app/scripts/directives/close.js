/**
 * Created by igi on 04.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('close', function () {
        return {
            restrict: 'C',
            template: '<i class="fa fa-times"></i>'
        };
    });
