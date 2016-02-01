/**
 * Created by igi on 24.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('selectDate', function (i18n) {
        return {
            template: '<p class="input-group"><input type="text" class="form-control" id="{{dataId}}" name="{{dataId}}" ' +
                'uib-datepicker-popup ng-model="result" is-open="model.opened" min-date="minDate" max-date="maxDate" ' +
                'datepicker-options="{{model.dateOptions}}" ng-required="{{model.required}}" required="{{model.required}}" ' +
                'close-text="{{model.closeText}}" placeholder="{{model.placeholder}}"/><span class="input-group-btn">' +
                '<button type="button" class="btn btn-default" ng-click="open($event)">' +
                '<i class="glyphicon glyphicon-calendar"></i></button></span></p>',
            restrict: 'E',
            scope: {
                result: '=',
                minDate: '=',
                maxDate: '=',
                options: '='
            },
            controller: function ($scope, $element) {
                $scope.dataId = $element.attr('data-id');
                $scope.model = {
                    opened: false,
                    err: null
                };
                if ($scope.result && !($scope.result instanceof Date)) {
                    $scope.result = new Date($scope.result);
                }
                angular.extend($scope.model, $scope.options);

                $scope.model.placeholder = $scope.model.placeholder || i18n.translate('DATEPICKER.PLACEHOLDER');

                $scope.open = function () {
                    $scope.model.opened = true;
                };
            }
        };
    });
