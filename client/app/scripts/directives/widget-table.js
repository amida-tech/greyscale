/**
 * Created by igi on 03.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('widgetTable', function (NgTableParams, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/widget-table.html',
            scope: {
                model: '=',
                rowSelector: '='
            },
            controller: function ($scope) {

                if (typeof $scope.rowSelector === 'function') {
                    $scope.model.current = $scope.rowSelector();
                } else {
                    $scope.model.current = null;
                }

                if (!$scope.model.tableParams || !($scope.model.tableParams instanceof NgTableParams)) {
                    $scope.model.tableParams = new NgTableParams(
                        {
                            page: 1,
                            count: $scope.model.pageLength || 5,
                            sorting: $scope.model.sorting || null
                        },
                        {
                            counts: [],
                            getData: function ($defer, params) {
                                if (typeof $scope.model.dataPromise === 'function') {
                                    $scope.model.dataPromise().then(function (data) {
                                        if (data) {
                                            params.total(data.length);
                                            var orderedData = params.sorting() ?
                                                $filter('orderBy')(data, params.orderBy()) : data;
                                            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                                        }
                                    });
                                }
                            }
                        }
                    );
                }
                $scope.isSelected = function (row) {
                    return (typeof $scope.rowSelector !== 'undefined' && $scope.model.current === row);
                };

                $scope.select = function (row) {
                    $scope.model.current = row;
                    if (typeof $scope.rowSelector === 'function') {
                        $scope.rowSelector(row);
                    } else {
                        $scope.rowSelector = row;
                    }
                };
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
                        elem.addClass('text-right');
                        elem.append('<button ng-repeat="act in widgetCell.actions" class="btn btn-xs btn-{{act.class}}" ' +
                            'ng-click="act.handler(rowValue)">{{act.title}}</button>');
                        $compile(elem.contents())($scope);
                        break;
                    case 'boolean':
                        elem.addClass('text-center');
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
