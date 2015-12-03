/**
 * Created by igi on 14.11.15.
 */
"use strict";
angular.module('greyscaleApp')
    .directive('isEqual', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                if (ngModel) {
                    var validate = function () {
                        var val1 = ngModel.$viewValue;
                        var val2 = attrs.isEqual;

                        ngModel.$setValidity('equal', val1 === val2);
                    };

                    scope.$watch(attrs.ngModel, function () {
                        validate();
                    });

                    attrs.$observe('isEqual', function () {
                        validate();
                    });
                }
            }
        };
    });
