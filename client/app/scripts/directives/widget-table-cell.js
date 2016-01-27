/**
 * Created by igi on 25.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('widgetTableCell', function ($filter, $compile) {

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
            controllerAs: '',
            link: function ($scope, elem) {
                var cell = angular.copy($scope.widgetCell);

                _resolveDotNotation();

                var _field = cell.field;

                if (cell.showDataInput) {
                    $scope.model = $scope.rowValue;
                    _compileDataInput();

                } else if (cell.show) {

                    $scope.model = $scope.rowValue[_field];

                    switch (cell.dataFormat) {
                    case 'action':
                        elem.addClass('text-right row-actions');
                        elem.append('<button ng-repeat="act in widgetCell.actions" class="btn btn-xs btn-{{act.class}}" ' +
                            'ng-click="act.handler(rowValue);$event.stopPropagation();"><i class="fa {{act.icon}}" ng-show="act.icon"> </i>{{act.title}}</button>');
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
                            elem.append('<span class="text-danger"><i class="fa fa-warning"></i></span>');
                        }
                        break;

                    case 'text':
                    case 'textarea':
                        elem.append($scope.rowValue[_field]);
                        break;

                    default:
                        if (cell.multiselect) {
                            _compileMultiselectCell();
                        } else {
                            _compileDefaultCell();
                        }
                    }

                    if (cell.link) {
                        _compileLinkCell();
                    }
                }

                function _compileMultiselectCell() {
                    elem.addClass('text-center');
                    elem.append('<input type="checkbox" class="multiselect-checkbox disable-control" ng-model="modelMultiselect.selected[rowValue.id]" ng-change="modelMultiselect.fireChange()" />');
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
                    elem.html(link[0].outerHTML);
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
                    }
                    $compile(elem.contents())($scope);
                }
            }
        };
    });
