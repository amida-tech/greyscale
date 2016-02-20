/**
 * Created by igi on 20.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsMinLength', function (greyscaleUtilsSrv) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                var min = attrs.gsMinLength;
                if (ngModel && min > 0) {
                    var validate = function () {
                        var value = ngModel.$viewValue;
                        var inWords = attrs.gsInWords;
                        var length = inWords ? greyscaleUtilsSrv.countWords(value) : value.length;
                        ngModel.$setValidity('minLength', min <= length);
                    };

                    scope.$watch(attrs.ngModel, function () {
                        validate();
                    });

                    attrs.$observe('gsMinLength', function () {
                        validate();
                    });
                }
            }
        };
    });
