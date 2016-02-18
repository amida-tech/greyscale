/**
 * Created by igi on 25.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('widgetTableCell', function ($filter, $compile, $q, $http, $templateCache) {

        function decode(_set, dict, value) {
            var res = value;
            var _expr = {};
            _expr[_set.keyField] = value;
            var _data = $filter('filter')(dict, _expr);

            if (_data.length > 0) {
                res = _data[0][_set.valField];
            }

            return res;
        }

        return {
            restrict: 'A',
            scope: {
                widgetCell: '=widgetTableCell',
                rowValue: '=',
                modelMultiselect: '='
            },
            link: function ($scope, elem) {
                var cell = angular.copy($scope.widgetCell);

                _resolveDotNotation();

                var _field = cell.field;

                var showDataInput;
                if (typeof cell.showDataInput === 'function') {
                    showDataInput = cell.showDataInput();
                } else {
                    showDataInput = cell.showDataInput;
                }
                if (showDataInput) {
                    $scope.model = $scope.rowValue;
                    _compileDataInput();

                } else if (cell.show) {

                    $scope.model = $scope.rowValue[_field];

                    switch (cell.dataFormat) {
                    case 'action':
                        elem.addClass('text-right row-actions');
                        elem.append('<a ng-repeat="act in widgetCell.actions" title="{{act.tooltip||act.getTooltip(rowValue)|translate}}" ' +
                            'class="action action-{{act.class}}" ng-init="icon = act.icon||act.getIcon(rowValue)"' +
                            'ng-click="act.handler && act.handler(rowValue); act.handler && $event.stopPropagation();"><i class="fa {{icon}}" ng-show="icon"> </i>{{act.title|translate}}</a>');
                        $compile(elem.contents())($scope);
                        break;

                    case 'option':
                        var _set = cell.dataSet;
                        if (_set.getData) {
                            elem.append(decode(_set, _set.getData($scope.rowValue), $scope.rowValue[_field]));
                        } else if (_set.dataPromise) {
                            elem.append('{{model}}');
                            $compile(elem.contents())($scope);
                            _set.dataPromise($scope.rowValue).then(function (dict) {
                                $scope.model = decode(_set, dict, $scope.model);
                            });
                        }
                        break;

                    case 'boolean':
                        elem.addClass('text-center');
                        if ($scope.rowValue[_field] === true) {
                            elem.append('<span class="text-success"><i class="fa fa-check"></i></span>');
                        } else if ($scope.rowValue[_field] === false) {
                            elem.append('<span class="text-danger"><i class="fa fa-minus"></i></span>');
                        }
                        break;

                    case 'text':
                    case 'textarea':
                        elem.append($scope.rowValue[_field]);
                        break;

                    default:
                        if (cell.multiselect) {
                            _compileMultiselectCell();
                        } else if (cell.cellTemplate) {
                            _compileCellTemplate(cell.cellTemplate, cell.cellTemplateExtData);
                        } else if (cell.cellTemplateUrl) {
                            _compileCellTemplateFromUrl();
                        } else {
                            _compileDefaultCell();
                        }
                    }

                    if (cell.link) {
                        _compileLinkCell();
                    }

                    if (cell.cellClass) {
                        elem.addClass(cell.cellClass);
                    }
                }

                function _compileCellTemplate(template, ext) {
                    $scope.row = $scope.rowValue;
                    $scope.cell = $scope.model;
                    elem.append(template);
                    $scope.ext = ext;
                    $compile(elem.contents())($scope);
                }

                function _compileCellTemplateFromUrl() {
                    _getTemplateByUrl(cell.cellTemplateUrl)
                        .then(function (template) {
                            _compileCellTemplate(template, cell.cellTemplateExtData);
                        });
                }

                function _getTemplateByUrl(templateUrl) {
                    return $http.get(templateUrl, {
                            cache: $templateCache
                        })
                        .then(function (response) {
                            return response.data;
                        });
                }

                function _compileMultiselectCell() {
                    elem.addClass('text-center');
                    elem.append('<div class="form-group"><div class="checkbox"><label>' +
                        '<input type="checkbox" class="multiselect-checkbox disable-control" ' +
                        'ng-model="modelMultiselect.selected[rowValue.id]" ng-change="modelMultiselect.fireChange()" />' +
                        '<div class="chk-box"></div></label></div></div>');
                    $compile(elem.contents())($scope);
                }

                function _compileDefaultCell() {
                    elem.append((cell.dataFormat) ? $filter(cell.dataFormat)($scope.rowValue[_field]) : $scope.rowValue[_field]);
                }

                function _compileLinkCell() {
                    var label = elem.text();
                    var link = angular.element('<a>' + label + '</a>');
                    if (cell.link.state) {
                        link.attr('ui-sref', cell.link.state);
                    } else if (cell.link.href) {
                        link.attr('ng-href', cell.link.href);
                    }
                    if (cell.link.target) {
                        link.attr('target', cell.link.target);
                    }
                    if (cell.link.handler) {
                        link.attr('href', '');
                        link.on('click', function () {
                            var tableRow = $scope.$parent.$parent.row;
                            cell.link.handler(tableRow);
                        });
                    }
                    elem.html('');
                    elem.append(link);
                    $scope.item = $scope.rowValue;
                    $compile(elem.contents())($scope);
                }

                function _resolveDotNotation() {
                    if (cell.field && cell.field.match(/\w+\.\w+/)) {
                        var parts = cell.field.split('.');
                        $scope.rowValue = $scope.rowValue[parts[0]] || {};
                        cell.field = parts[1];
                    }
                }

                function _compileDataInput() {
                    elem.addClass('input-cell');
                    elem.append('<div class="form-group" ' +
                        'modal-form-rec="model" ' +
                        'embedded="true" modal-form-field="widgetCell" ' +
                        'modal-form-field-model="model.' + _field + '" ' +
                        '></div>');
                    switch (cell.dataFormat) {
                    case 'date':
                        elem.addClass('auto-width');
                        break;
                    case 'boolean':
                        elem.addClass('text-center');
                        break;
                    }
                    $compile(elem.contents())($scope);
                }
            }
        };
    });
