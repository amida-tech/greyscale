/**
 * Created by igi on 24.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('modalFormField', function ($compile, greyscaleUtilsSrv) {
        return {
            restrict: 'A',
            scope: {
                modalFormField: '=',
                modalFormFieldModel: '='
            },
            link: function (scope, elem) {
                var clmn = scope.modalFormField;

                if (clmn.title) {
                    elem.append('<label for="' + clmn.field + '" class="col-sm-3 control-label">' + clmn.title + ':</label>');

                    var field = '<div class="col-sm-9">';

                    if (clmn.dataReadOnly && clmn.dataReadOnly === 'both') {
                        field += '<p class="form-control-static">';
                        switch (clmn.dataFormat) {
                            case 'date':
                                field += '{{modalFormFieldModel | date:"short"}}';
                                break;
                            case 'option':
                                field += greyscaleUtilsSrv.decode(scope.model.options, 'id', scope.modalFormFieldModel, 'title') || '';
                                break;
                            default:
                                field += '{{modalFormFieldModel}}';
                        }
                        field += '</p>';
                    } else {
                        switch (clmn.dataFormat) {
                            case 'textarea':
                                field += '<textarea class="form-control" type="text"  id="' + clmn.field +
                                    '" name="' + clmn.field + '" ng-model="modalFormFieldModel"></textarea>';
                                break;
                            case 'date':
                                field += '<select-date data-id="' + clmn.field + '" result="modalFormFieldModel"></select-date>';
                                break;
                            case 'option':
                                field += '<select class="form-control" id="' + clmn.field + '" name="' + clmn.field +
                                    '" ng-options="item.id as item.title for item in model.options" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"></select>';
                                break;
                            default:
                                field += '<input type="text" class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel"/>';
                        }
                    }

                    field += '</div>';

                    elem.append(field);
                    $compile(elem.contents())(scope);
                }
            },
            controller: function formFieldController($scope) {
                var clmn = $scope.modalFormField;
                var _options = [];
                if (clmn.dataFormat === 'option') {
                    var data = clmn.dataSet.getData();
                    for (var d = 0; d < data.length; d++) {
                        _options.push({
                            id: data[d][clmn.dataSet.keyField],
                            title: data[d][clmn.dataSet.valField]
                        });
                    }
                }
                $scope.model = {
                    options: _options
                };
            }
        };
    });
