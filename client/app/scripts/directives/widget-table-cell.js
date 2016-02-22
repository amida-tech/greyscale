/**
 * Created by igi on 25.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('widgetTableCell', function (_, $sce, $timeout, $filter, $compile, $q, $http, $templateCache) {

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
                            _setModelFromData(_set, _set.getData($scope.rowValue));
                            //$scope.model = decode(_set, _set.getData($scope.rowValue), $scope.rowValue[_field]);
                        } else if (_set.dataPromise) {
                            _set.dataPromise($scope.rowValue).then(function (data) {
                                //$scope.model = decode(_set, dict, $scope.model);
                                _setModelFromData(_set, data);
                            });
                        }
                        if (cell.cellTemplateUrl) {
                            _getTemplateByUrl(cell.cellTemplateUrl)
                                .then(function (template) {
                                    _resolveCellTemplate(template, cell.cellTemplateExtData);
                                });
                        } else if (cell.cellTemplate) {
                            _resolveCellTemplate(cell.cellTemplate, cell.cellTemplateExtData);
                        } else {
                            elem.append('{{model}}');

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
                            _resolveMultiselectCell();
                        } else if (cell.cellTemplate) {
                            _resolveCellTemplate(cell.cellTemplate, cell.cellTemplateExtData);
                        } else if (cell.cellTemplateUrl) {
                            _resolveCellTemplateFromUrl();
                        } else {
                            _resolveDefaultCell();
                        }
                    }

                    if (cell.link) {
                        _resolveLinkCell();
                    }

                    if (cell.cellClass) {
                        elem.addClass(cell.cellClass);
                    }

                    $compile(elem.contents())($scope);
                    elem.addClass('compiled');
                }

                function _setModelFromData(_set, data) {
                    var search = {};
                    search[_set.keyField] = $scope.rowValue[_field];
                    var option = _.find(data, search);
                    $scope.model = '';
                    if (!option) {
                        return;
                    }
                    $scope.option = option;
                    if (_set.valField) {
                        $scope.model = option[_set.valField];
                    } else if (_set.template) {
                        var render = $compile('<span>' + _set.template + '</span>')($scope);
                        $timeout(function () {
                            $scope.model = render.text();
                        });
                    }

                }

                function _resolveCellTemplate(template, ext) {
                    $scope.row = $scope.rowValue;
                    $scope.cell = $scope.model;
                    $scope.ext = ext;
                    if (elem.hasClass('compiled')) {
                        var linkCell = elem.find('>a');
                        var compiledTemplate = $compile('<div>' + template + '</div>')($scope);
                        if (linkCell.length) {
                            linkCell.append(compiledTemplate);
                        } else {
                            elem.append(compiledTemplate);
                        }
                    } else {
                        elem.append(template);
                    }
                }

                function _resolveCellTemplateFromUrl() {
                    _getTemplateByUrl(cell.cellTemplateUrl)
                        .then(function (template) {
                            _resolveCellTemplate(template, cell.cellTemplateExtData);
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

                function _resolveMultiselectCell() {
                    elem.addClass('text-center');
                    elem.append('<div class="form-group"><div class="checkbox"><label>' +
                        '<input type="checkbox" class="multiselect-checkbox disable-control" ' +
                        'ng-model="modelMultiselect.selected[rowValue.id]" ng-change="modelMultiselect.fireChange()" />' +
                        '<div class="chk-box"></div></label></div></div>');

                }

                function _resolveDefaultCell() {
                    elem.append((cell.dataFormat) ? $filter(cell.dataFormat)($scope.rowValue[_field]) : $scope.rowValue[_field]);
                }

                function _resolveLinkCell() {
                    var label = elem.html();
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
