/**
 * Created by igi on 20.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsLength', function (greyscaleUtilsSrv) {

        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                field: '=gsLength'
            },
            link: function (scope, elem, attrs, ngModel) {
                if (ngModel) {

                    var validate = function () {
                        var val = ngModel.$viewValue;
                        if (scope.field) {
                            scope.field.length = attrs.gsInWords ? greyscaleUtilsSrv.countWords(val) : val;
                            scope.field.valid = ngModel.$valid;
                        }
                    };

                    scope.$watch(attrs.ngModel, function () {
                        validate();
                    });
                }
            }
        };
    });
