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
    .directive('widgetCell', function ($log, $filter) {
        return {
            restrict: 'A',
            scope: {
                cellFormat: '=',
                cellValue: '='
            },
            link: function ($scope, elem) {
                switch ($scope.cellFormat) {
                    case 'boolean':
                        if ($scope.cellValue) {
                            elem.append('<span class="text-success"><i class="fa fa-check"></i></span>');
                        } else {
                            elem.append('<span class="text-danger"><i class="fa fa-warning"></i></span>');
                        }
                        break;
                    default:
                        elem.append(($scope.cellFormat) ? $filter($scope.cellFormat)($scope.cellValue) : $scope.cellValue);
                }
            }
        };
    });
