/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('widgetTable', function (_, NgTableParams, $filter, i18n) {
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

                _translateParams($scope.model);

                if (!$scope.model.tableParams || !($scope.model.tableParams instanceof NgTableParams)) {

                    _parseColumns($scope.model);

                    $scope.model.tableParams = new NgTableParams({
                        page: 1,
                        count: $scope.model.pageLength || 5,
                        sorting: $scope.model.sorting || null
                    }, {
                        counts: [],
                        getData: function ($defer, params) {
                            if (typeof $scope.model.dataPromise === 'function') {
                                $scope.model.dataPromise().then(function (data) {
                                    $scope.model.dataMap = _getDataMap(data);
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

                $scope.isDisabled = function (row) {
                    if (!$scope.model.multiselect) {
                        return false;
                    } else {
                        return $scope.model.multiselect.disableOnUncheck && !$scope.model.multiselect.selected[row.id];
                    }
                };

                $scope.select = function (row, e) {
                    $scope.model.current = row;
                    if (typeof $scope.rowSelector === 'function') {
                        $scope.rowSelector(row);
                    } else {
                        $scope.rowSelector = row;
                    }
                };

                $scope.$on('$destroy', function () {
                    if ($scope.model.multiselect && $scope.model.multiselect.reset) {
                        $scope.model.multiselect.reset();
                    }
                });
            }
        };

        function _getDataMap(data) {
            var map = [];
            angular.forEach(data, function (item) {
                map.push(item.id);
            });
            return map;
        }

        function _translateParams(table) {
            var params = ['formTitle', 'title'];
            angular.forEach(params, function (param) {
                table[param] = i18n.translate(table[param]);
            });
        }

        function _parseColumns(model) {
            angular.forEach(model.cols, function (col) {
                if (col.multiselect) {
                    _setMultiselect(col, model);
                }
                if (col.actions) {
                    col['class'] = 'header-actions';
                }
                col.title = i18n.translate(col.title);
            });
        }

        function _setMultiselect(col, model) {

            if (model.multiselect && model.multiselect.init) {
                return;
            }

            col.class = 'header-multiselect';
            col.headerTemplateURL = function () {
                return 'ng-table/headers/check-all.html';
            };

            model.multiselect = angular.extend({
                init: true,
                selected: {},
                selectedMap: [],
                selectAllState: false,
                disableOnUncheck: col.multiselectDisableOnUncheck,
                selectAll: _selectAll(model),
                fireChange: _fireChange(model),
                reset: _reset,
                onChange: function () {},
                setSelected: _setSelected
            }, model.multiselect || {});

            function _selectAll(model) {
                return function () {
                    var state = this.selectAllState;
                    angular.forEach(model.dataMap, function (id) {
                        model.multiselect.selected[id] = state;
                    });
                };
            }

            function _fireChange(model) {
                return function () {
                    return _fireChangeHandler(model);
                };
            }

            function _fireChangeHandler(model) {
                var selected = [];
                angular.forEach(model.dataMap, function (id) {
                    if (model.multiselect.selected[id]) {
                        selected.push(id);
                    }
                });
                model.multiselect.selectedMap = selected;
                if (typeof model.multiselect.onChange === 'function') {
                    model.multiselect.onChange(selected);
                }
            }

            function _reset() {
                model.multiselect.selected = {};
                model.multiselect.selectedMap = [];
                model.multiselect.selectAllState = false;
            }

            function _setSelected(list, field) {
                _reset();
                field = field || 'id';
                angular.forEach(_.filter(list, field), function (item) {
                    model.multiselect.selectedMap.push(item[field]);
                    model.multiselect.selected[item[field]] = true;
                });
            }
        }

    });
