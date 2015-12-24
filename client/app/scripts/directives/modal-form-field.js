/**
 * Created by igi on 24.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('modalFormField', function () {
        return {
            restrict: 'AE',
            require: '?ngModel',
            link: function (scope, elem, attr, ngModel){

            },
            scope: {

            }
        }
    });
