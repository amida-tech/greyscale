/**
 * Created by igi on 21.02.16.
 */

'use strict';
angular.module('greyscaleApp')
    .directive('gsValid', function ($log) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                scope.$watch(attrs.gsValid, function(gsValid){
                    if (gsValid && ngModel) {
                        gsValid.ngModel = ngModel;
                    }
                })
            }
        };
    });
