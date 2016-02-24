/**
 * Created by igi on 21.02.16.
 */

'use strict';
angular.module('greyscaleApp')
    .directive('gsValid', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                field: '=gsValid'
            },
            link: function (scope, elem, attrs, ngModel) {
                if (ngModel && scope.field) {
                    scope.field.ngModel = ngModel;
                }
            }
        };
    });
