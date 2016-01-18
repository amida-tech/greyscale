/**
 * Created by igi on 03.12.15.
 */
'use strict';

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
                    $scope.model.tableParams = new NgTableParams({
                        page: 1,
                        count: $scope.model.pageLength || 5,
                        sorting: $scope.model.sorting || null
                    }, {
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
                    });
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
    });
