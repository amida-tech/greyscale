/**
 * Created by igi on 24.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('selectDate', function (i18n, $locale) {
        return {
            template: '<p class="input-group"><input type="text" class="form-control {{class}}" id="{{dataId}}" name="{{dataId}}" ' +
                'uib-datepicker-popup ng-model="result" gs-valid="validator" is-open="model.opened" min-date="minDate" max-date="maxDate" ' +
                'datepicker-options="model.dateOptions" ng-required="{{model.required}}" required="{{model.required}}" ' +
                'ng-readonly="{{model.readonly}}"' +
                'close-text="{{model.closeText}}" placeholder="{{model.placeholder}}"/><span class="input-group-btn">' +
                '<button type="button" class="btn btn-default" ng-click="open($event)" ng-disabled="{{model.disabled}}">' +
                '<i class="glyphicon glyphicon-calendar"></i></button></span></p>',
            restrict: 'E',
            required: '^ngModel',
            scope: {
                result: '=',
                minDate: '=',
                maxDate: '=',
                options: '=',
                validator: '=?',
                onChange: '&?'
            },
            controller: function ($scope, $element) {
                $scope.dataId = $element.attr('data-id');

                if ($element.attr('embedded') !== undefined) {
                    $scope.class = 'embedded';
                }

                $scope.model = {
                    opened: false,
                    err: null
                };
                if ($scope.result && !($scope.result instanceof Date)) {
                    $scope.result = new Date($scope.result);
                }
                angular.extend($scope.model, $scope.options);

                var firstDay = $locale.DATETIME_FORMATS.FIRSTDAYOFWEEK + 1;
                if (firstDay > 6) {
                    firstDay = 0;
                }
                $scope.model.dateOptions = $scope.model.dateOptions || {};
                $scope.model.dateOptions.startingDay = firstDay;

                $scope.model.placeholder = $scope.model.placeholder || i18n.translate('DATEPICKER.PLACEHOLDER');

                $scope.open = function () {
                    $scope.model.opened = true;
                };

                if ($scope.onChange !== undefined) {
                    var stopWatch = $scope.$watch('result', function () {
                        $scope.$eval($scope.onChange);
                    });
                    $scope.$on('$destroy', function () {
                        stopWatch();
                    });
                }
            }
        };
    });
