/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .service('widgetTableSrv', function (_, NgTableParams, $filter,
        $compile, i18n, $timeout, $templateCache, $rootScope) {

        var _templateCacheIds = [];

        return {
            init: _init
        };

        function _init(config) {
            var scope = config.scope;
            var rowSelector = config.rowSelector;
            var model = config.model;

            if (typeof rowSelector === 'function') {
                model.current = rowSelector();
            } else {
                model.current = null;
            }

            _translateParams(model);

            if (!model.tableParams || !(model.tableParams instanceof NgTableParams)) {

                _parseColumns(model);

                model.tableParams = new NgTableParams({
                    page: 1,
                    count: model.pageLength || 5,
                    sorting: model.sorting || null
                }, {
                    counts: [],
                    getData: function ($defer, params) {
                        console.log('dddddddd');
                        if (typeof model.dataPromise === 'function') {
                            model.$loading = true;
                            var endLoading = function () {
                                model.$loading = false;
                            };
                            model.dataPromise()
                                .then(function (data) {
                                    model.dataMap = _getDataMap(data);
                                    if (data) {
                                        params.total(data.length);
                                        var orderedData = params.sorting() ?
                                            $filter('orderBy')(data, params.orderBy()) : data;
                                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                                    }
                                    endLoading();
                                })
                                .catch(endLoading);
                        }
                    }
                });
            }
            scope.isSelected = function (row) {
                return (typeof scope.rowSelector !== 'undefined' && model.current === row);
            };

            scope.isDisabled = function (row) {
                if (!model.multiselect) {
                    return false;
                } else {
                    return model.multiselect.disableOnUncheck && !model.multiselect.selected[row.id];
                }
            };

            scope.select = function (row, e) {
                if (!model.selectable) {
                    return;
                }
                model.current = row;
                if (typeof scope.rowSelector === 'function') {
                    scope.rowSelector(row);
                } else {
                    scope.rowSelector = row;
                }
            };

            scope.$on('$destroy', function () {
                if (model.multiselect && model.multiselect.reset) {
                    model.multiselect.reset();
                }
                if (_templateCacheIds.length) {
                    angular.forEach(_templateCacheIds, function (templateId) {
                        $templateCache.remove(templateId);
                    });
                }
            });
        }

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
            angular.forEach(model.cols, function (col, i) {
                if (col.multiselect) {
                    _setMultiselect(col, model);
                }
                if (col.actions) {
                    col['class'] = 'header-actions';
                }
                if (col.title) {
                    col.title = i18n.translate(col.title);
                }
                if (col.titleTemplate) {
                    _setTitleTemplate(col);
                }
            });
        }

        function _setTitleTemplate(col) {
            var template = col.titleTemplate;
            var templateId = 'widget-table-' + Math.random();
            _templateCacheIds.push(templateId);
            var scope = $rootScope.$new();
            angular.extend(scope, col.titleTemplateData || {});
            template = $compile(template)(scope);
            $templateCache.put(templateId, template);
            col.headerTemplateURL = function () {
                return templateId;
            };
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
    })
    .directive('widgetTable', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/widget-table.html',
            scope: {
                model: '=',
                rowSelector: '=',
                classes: '@class'
            },
            link: function (scope, el) {
                el.removeAttr('class');
            },
            controller: function ($scope, widgetTableSrv) {
                widgetTableSrv.init({
                    scope: $scope,
                    model: $scope.model,
                    rowSelector: $scope.rowSelector
                });
            }
        };
    });
