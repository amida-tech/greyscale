/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .service('widgetTableSrv', function (_, $q, NgTableParams, $filter,
        $compile, i18n, $timeout, $templateCache, $rootScope, ngTableEventsChannel) {

        return {
            init: _init
        };

        function _init(config) {

            var scope = config.scope;

            var model = config.model;
            model.el = config.el;

            model.current = null;

            //if (typeof rowSelector === 'function') {
            //    model.current = rowSelector();
            //} else {
            //    model.current = null;
            //}

            scope.sortableOptions = {
                disabled: true
            };

            _translateParams(model);

            if (!model.tableParams || !(model.tableParams instanceof NgTableParams)) {

                _parseColumns(model);

                model.tableParams = new NgTableParams({
                    page: 1,
                    count: model.pageLength || 5,
                    sorting: model.sorting || null
                }, {
                    counts: model.pageLengths || [],
                    getData: function ($defer, params) {
                        if (typeof model.dataPromise === 'function') {
                            var t;
                            if (model.$loading === undefined) {
                                model.$loading = true;
                            } else {
                                t = setTimeout(function () {
                                    model.$loading = true;
                                }, 150);
                            }
                            var endLoading = function () {
                                clearTimeout(t);
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

                if (typeof model.onInit === 'function') {
                    model.onInit();
                }

                model.tableParams.custom = {
                    showAllButton: !!model.showAllButton
                };

                model.tableParams.pager = _newPagination(scope);
            }

            if (model.dragSortable) {
                scope.sortableOptions = {
                    handle: '.action-drag-sortable',
                    start: function (e, ui) {
                        ui.placeholder.height(ui.item.height());
                    }
                };
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
                model.$loading = undefined;
            });

            if (typeof config.onReload === 'function') {
                ngTableEventsChannel.onAfterReloadData(config.onReload, scope);
            }
        }

        function _newPagination(scope) {
            var params = scope.model.tableParams;
            return {
                from: function () {
                    return 1 + params.count() * (params.page() - 1);
                },
                to: function () {
                    var to = params.count() * params.page();
                    if (to > params.total()) {
                        to = params.total();
                    }
                    return to;
                },
                first: function () {
                    return params.page() === 1;
                },
                last: function () {
                    return this.to() === params.total();
                },
                itemsName: function () {
                    return scope.model.title ? scope.model.title + ' ' : '';
                },
                prev: function () {
                    if (!this.first()) {
                        params.page(params.page() - 1);
                    }
                },
                next: function () {
                    if (!this.last()) {
                        params.page(params.page() + 1);
                    }
                }
            };
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
            var scope = $rootScope.$new();
            scope.ext = col.titleTemplateExtData || {};
            template = $compile('<div>' + template + '</div>')(scope);
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
                if (field) {
                    angular.forEach(_.filter(list, field), function (item) {
                        model.multiselect.selectedMap.push(item[field]);
                        model.multiselect.selected[item[field]] = true;
                    });
                } else {
                    angular.forEach(list, function (id) {
                        model.multiselect.selectedMap.push(id);
                        model.multiselect.selected[id] = true;
                    });
                }
            }
        }
    })
    .directive('widgetTable', function (_, $templateCache, $compile, $http, $timeout, ngTableEventsChannel) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/widget-table.html',
            scope: {
                model: '=',
                rowSelector: '=',
                classes: '@class'
            },
            link: function (scope, el) {
                el.find('table').addClass(scope.model.classes);
                el.removeAttr('class');
                _expandableRowFunctionality(scope, el);
                _delegateClickFunctionality(scope, el);
                if (scope.model.columnShowOnHover) {
                    _columnShowOnHoverFunctionality(scope, el);
                }
            },
            controller: function ($scope, $element, widgetTableSrv) {
                widgetTableSrv.init({
                    el: $element,
                    scope: $scope,
                    model: $scope.model,
                    rowSelector: $scope.rowSelector,
                    onReload: function () {
                        if (typeof $scope.model.onReload === 'function') {
                            $scope.model.onReload();
                        }
                    }
                });
            }
        };

        function _findExpanded(rowEl) {
            var next = rowEl.next();
            if (next.hasClass('expand-row')) {
                return next;
            } else {
                return _findExpanded(next);
            }
        }

        function _columnShowOnHoverFunctionality(scope, el) {
            $(el).on('mouseenter', '.column-hover', function () {
                var el = $(this);
                var hoveredCellIndex = el.context.cellIndex;
                var table = el.closest('table');
                var cells = table.find('.column-hover');
                cells.each(function (i, cell) {
                    cell = $(cell);
                    if (cell.context.cellIndex === hoveredCellIndex) {
                        cell.addClass('column-hovered');
                    } else {
                        cell.removeClass('column-hovered');
                    }
                });
            });
        }

        function _expandableRowFunctionality(scope, el) {
            var expandedRowTemplate = scope.model.expandedRowTemplate;
            var expandedRowTemplateUrl = scope.model.expandedRowTemplateUrl;
            if (!expandedRowTemplate && !expandedRowTemplateUrl) {
                return;
            }

            if (expandedRowTemplateUrl) {
                _getTemplateByUrl(expandedRowTemplateUrl)
                    .then(function (template) {
                        _controlRowExpanding(el, template, scope);
                    });
            } else if (expandedRowTemplate) {
                _controlRowExpanding(el, expandedRowTemplate, scope);
            }
        }

        function _getTemplateByUrl(templateUrl) {
            return $http.get(templateUrl, {
                    cache: $templateCache
                })
                .then(function (response) {
                    return response.data;
                });
        }

        function _controlRowExpanding(el, template, scope) {
            el.on('click', '.action-expand-row', function (e) {
                var row = $(e.target).closest('.expandable-row');
                if (!row.hasClass('is-expanded')) {
                    _showExpandedRow(row, template, scope);
                } else {
                    _hideExpandedRow(row, scope);
                }
            });
            el.on('click', '.action.expand-all', function () {
                var btn = $(this);
                if (btn.hasClass('all-expanded')) {
                    el.find('.action-expand-row.is-expanded').click();
                    btn.removeClass('all-expanded');
                } else {
                    el.find('.action-expand-row:not(.is-expanded)').click();
                    btn.addClass('all-expanded');
                }
            });
            scope.$openExpandedRow = function (rowEl) {
                _showExpandedRow(rowEl, template, scope);
            };
            ngTableEventsChannel.onAfterReloadData(function () {
                var expandAll = el.find('.action.expand-all');
                if (expandAll.length) {
                    if (scope.model.expandedRowShow) {
                        expandAll.addClass('all-expanded');
                    } else {
                        expandAll.removeClass('all-expanded');
                    }
                }
            }, scope);
        }

        function _showExpandedRow(rowEl, template, scope) {
            var nextRowEl = rowEl.next();
            if (nextRowEl.length && nextRowEl.hasClass('expand-row')) {
                nextRowEl.show();
            } else {
                var colspan = scope.model.cols.length;
                var expand = $('<tr class="expand-row"><td colspan="' + colspan + '">' + template + '</td></tr>');
                var rowScope = rowEl.scope();
                $compile(expand)(rowScope);
                $timeout(function () {
                    rowEl.after(expand);
                    rowScope.$digest();
                });
            }
            rowEl.addClass('is-expanded');
        }

        function _hideExpandedRow(rowEl, scope) {
            var nextRowEl = rowEl.next();
            if (nextRowEl.length && nextRowEl.hasClass('expand-row')) {
                nextRowEl.hide();
            }
            rowEl.removeClass('is-expanded');
        }

        function _delegateClickFunctionality(scope, el) {
            var handlers = scope.model.delegateClick;
            if (handlers && angular.isObject(handlers)) {
                angular.forEach(handlers, function (handler, selector) {
                    if (typeof handler === 'function') {
                        el.on('click', selector, function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            var trigger = angular.element(e.target);
                            handler(e, trigger.scope());
                        });
                    }
                });
            }
        }
    })
    .directive('widgetTableExpandedRowOpen', function () {
        return {
            restrict: 'A',
            scope: {
                open: '=widgetTableExpandedRowOpen'
            },
            link: function (scope, el) {
                if (scope.open) {
                    scope.$parent.$openExpandedRow(el);
                }
            }

        };
    });
