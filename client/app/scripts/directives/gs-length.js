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
                        if (scope.field) {
                            var val = ngModel.$viewValue;
                            var max = scope.field.maxLength;
                            var min = scope.field.minLength;
                            if (val) {
                                scope.field.length = scope.field.inWords ? greyscaleUtilsSrv.countWords(val) : val.length;
                            } else {
                                scope.field.length = 0;
                            }
                            if (min) {
                                ngModel.$setValidity('minlength', min <= scope.field.length);
                            }
                            if (max) {
                                ngModel.$setValidity('maxlength', max >= scope.field.length);
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
