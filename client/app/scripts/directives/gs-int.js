/**
 * Created by igi on 21.02.16.
 */

'use strict';

angular.module('greyscaleApp')
    .directive('gsInt', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                field: '=gsInt'
            },
            link: function (scope, elem, attrs, ngModel) {
                if (ngModel) {
                    var validate = function () {
                        if (scope.field) {
                            if (scope.field.intOnly) {
                                var value = ngModel.$viewValue;
                                if (value) {
                                    ngModel.$setValidity('integer', value * 1 === parseInt(value, 10));
                                }
                            }
                            scope.field.ngModel = ngModel;
                        }
                    };

                    scope.$watch(attrs.ngModel, function () {
                        validate();
                    });
                }
            }
        };
    });
