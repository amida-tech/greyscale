/**
 * Created by igi on 24.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('modalFormField', function ($compile, greyscaleUtilsSrv) {
        return {
            restrict: 'A',
            scope: {
                modalFormRec: '=',
                modalFormField: '=',
                modalFormFieldModel: '='
            },
            link: function (scope, elem) {
                var clmn = scope.modalFormField;
                var editMode = !!(scope.modalFormRec.id);

                if (clmn.title) {
                    elem.append('<label for="' + clmn.field + '" class="col-sm-3 control-label">' + clmn.title + ':</label>');

                    var field = '<div class="col-sm-9';

                    if (clmn.dataReadOnly === 'both' || editMode && clmn.dataReadOnly === 'edit') {
                        field += '"><p class="form-control-static">';
                        switch (clmn.dataFormat) {
                            case 'boolean':
                                if (scope.modalFormFieldModel === true) {
                                    field += '<span class="text-success"><i class="fa fa-check"></i></span>';
                                } else if (scope.modalFormFieldModel === false) {
                                    field += '<span class="text-danger"><i class="fa fa-warning"></i></span>';
                                }
                                break;
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
                        field += (clmn.dataFormat === 'boolean' ? ' checkbox' : '') +'">';
                        switch (clmn.dataFormat) {
                            case 'textarea':
                                field += '<textarea class="form-control" type="text"  id="' + clmn.field +
                                    '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"></textarea>';
                                break;
                            case 'date':
                                field += '<select-date data-id="' + clmn.field + '" result="modalFormFieldModel" ng-required="modalFormField.dataRequired"></select-date>';
                                break;
                            case 'option':
                                field += '<select class="form-control" id="' + clmn.field + '" name="' + clmn.field +
                                    '" ng-options="item.id as item.title for item in model.options" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"></select>';
                                break;
                            case 'boolean':
                                field += '<input type="checkbox" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"/>';
                                break;
                            default:
                                field += '<input type="text" class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"/>';
                        }
                    }

                    if(clmn.dataRequired === true) {
                        field += '<div class="text-center" ng-messages="dataForm.' + clmn.field + '.$error" role="alert" ng-if="$parent.dataForm.' + clmn.field + '.$dirty && !$parent.dataForm.' + clmn.field + '.$viewValue"><span class="help-block">This field is required.</span></div>';
                    }

                    field += '</div>';

                    elem.append(field);
                    $compile(elem.contents())(scope);
                }
            },
            controller: function formFieldController($scope) {
                var clmn = $scope.modalFormField;
                $scope.model = {
                    options: []
                };
                var _options = [];
                if (clmn.dataFormat === 'option') {
                    if (clmn.dataSet.getData) {
                        var data = clmn.dataSet.getData();
                        for (var d = 0; d < data.length; d++) {
                            _options.push({
                                id: data[d][clmn.dataSet.keyField],
                                title: data[d][clmn.dataSet.valField]
                            });
                        }
                        $scope.model.options = _options;
                    } else if (clmn.dataSet.dataPromise) {
                        clmn.dataSet.dataPromise($scope.modalFormRec).then(function(data){
                            $scope.model.options = data;
                        });
                    }
                }
            }
        };
    });
