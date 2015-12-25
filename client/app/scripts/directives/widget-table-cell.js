/**
 * Created by igi on 25.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('widgetTableCell', function ($filter, $compile) {
        return {
            restrict: 'A',
            scope: {
                widgetCell: '=widgetTableCell',
                rowValue: '='
            },
            link: function ($scope, elem) {
                var cell = $scope.widgetCell;
                if (cell.show) {
                    var _field = cell.field;

                    switch (cell.dataFormat) {
                        case 'action':
                            elem.addClass('text-right');
                            elem.append('<button ng-repeat="act in widgetCell.actions" class="btn btn-xs btn-{{act.class}}" ' +
                                'ng-click="act.handler(rowValue)"><i class="fa {{act.icon}}" ng-show="act.icon"> </i>{{act.title}}</button>');
                            $compile(elem.contents())($scope);
                            break;

                        case 'option':
                            var _set = cell.dataSet;
                            var _expr = {};
                            _expr[_set.keyField] = $scope.rowValue[_field];
                            var _data = $filter('filter')(_set.getData(), _expr);
                            if (_data.length > 0) {
                                elem.append(_data[0][_set.valField]);
                            } else {
                                elem.append(_set.valField);
                            }
                            break;

                        case 'boolean':
                            elem.addClass('text-center');
                            if ($scope.rowValue[_field]) {
                                elem.append('<span class="text-success"><i class="fa fa-check"></i></span>');
                            } else {
                                elem.append('<span class="text-danger"><i class="fa fa-warning"></i></span>');
                            }
                            break;

                        case 'text':
                        case 'textarea':
                            elem.append($scope.rowValue[_field]);
                            break;

                        default:
                            elem.append((cell.dataFormat) ? $filter(cell.dataFormat)($scope.rowValue[_field]) : $scope.rowValue[_field]);
                    }
                }
            }
        };
    });
