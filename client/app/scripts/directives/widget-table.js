/**
 * Created by igi on 03.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('widgetTable', function () {
        return {
            restrict: 'AE',
            templateUrl: 'views/directives/widget-table.html',
            scope: {
                model: '='
            }
        };
    })
    .directive('widgetCell', function ($filter, $compile) {
        return {
            restrict: 'A',
            scope: {
                widgetCell: '=',
                rowValue: '='
            },
            link: function ($scope, elem) {
                var _field = $scope.widgetCell.field;
                switch ($scope.widgetCell.dataFormat) {
                    case 'action':
                        elem.append('<button ng-repeat="act in widgetCell.actions" class="btn btn-xs btn-{{act.class}}" ' +
                            'ng-click="act.handler(rowValue)">{{act.title}}</button>');
                        $compile(elem.contents())($scope);
                        break;
                    case 'boolean':
                        if ($scope.rowValue[_field]) {
                            elem.append('<span class="text-success"><i class="fa fa-check"></i></span>');
                        } else {
                            elem.append('<span class="text-danger"><i class="fa fa-warning"></i></span>');
                        }
                        break;
                    default:
                        elem.append(($scope.widgetCell.dataFormat) ? $filter($scope.widgetCell.dataFormat)($scope.rowValue[_field]) : $scope.rowValue[_field]);
                }
            }
        };
    });
