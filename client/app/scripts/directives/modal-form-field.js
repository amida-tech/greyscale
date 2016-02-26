/**
 * Created by igi on 24.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('modalFormField', function ($compile, $timeout, greyscaleUtilsSrv, $templateCache, $http) {
        return {
            restrict: 'A',
            scope: {
                modalFormRec: '=',
                modalFormField: '=',
                modalFormFieldModel: '='
            },
            link: function (scope, elem, attr) {

                var clmn = scope.modalFormField;

                if (clmn.dataHide) {
                    elem.remove();
                    return;
                }

                var editMode = !!(scope.modalFormRec.id);

                var _embedded = !!attr.embedded;

                if (clmn.title) {
                    var field = '';
                    if (!_embedded) {
                        elem.append('<label for="' + clmn.field + '" class="col-sm-3 control-label">{{\'' + clmn.title + '\'|translate}}:</label>');
                        field += '<div class="col-sm-9';
                    }

                    if (clmn.dataReadOnly === 'both' || editMode && clmn.dataReadOnly === 'edit') {
                        if (!_embedded) {
                            field += '"><p class="form-control-static">';
                        }
                        switch (clmn.dataFormat) {
                        case 'boolean':
                            if (scope.modalFormFieldModel === true) {
                                field += '<span class="text-success"><i class="fa fa-check"></i></span>';
                            } else if (scope.modalFormFieldModel === false) {
                                field += '<span class="text-danger"><i class="fa fa-minus"></i></span>';
                            }
                            break;
                        case 'date':
                            field += '{{modalFormFieldModel|date}}';
                            break;
                        case 'option':
                            ///
                            field += greyscaleUtilsSrv.decode(scope.model.options, 'id', scope.modalFormFieldModel, 'title') || '';
                            break;
                        default:
                            if (clmn.cellTemplate) {
                                field += _compileCellTemplate(clmn.cellTemplate, clmn.cellTemplateExtData);
                            } else if (clmn.cellTemplateUrl) {
                                _getTemplateByUrl(clmn.cellTemplateUrl)
                                    .then(function (template) {
                                        field += _compileCellTemplate(template, clmn.cellTemplateExtData);
                                    });
                            } else {
                                field += '{{modalFormFieldModel}}';
                            }
                        }
                        if (!_embedded) {
                            field += '</p>';
                        }
                    } else {
                        if (!_embedded) {
                            field += '">';
                        }

                        switch (clmn.dataFormat) {
                        case 'textarea':
                            field += '<textarea class="form-control" type="text"  id="' + clmn.field +
                                '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"></textarea>';
                            break;
                        case 'date':
                            field += '<select-date data-id="' + clmn.field + '" ' +
                                'result="modalFormFieldModel" form-field-value="$parent.dataForm.' + clmn.field + '" ' +
                                (_embedded ? ' embedded ' : '') +
                                'ng-required="modalFormField.dataRequired"></select-date>';
                            if (!_embedded) {
                                field += '<div class="text-center" role="alert" ng-if="$parent.dataForm.' + clmn.field + '.$dirty && $parent.dataForm.' + clmn.field + '.$error.date"><span class="help-block" translate="FORMS.WRONG_DATE_FORMAT"></span></div>';
                            }
                            break;
                        case 'option':
                            field += '<select class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ' +
                                'ng-options="item.id as item.title disable when model.getDisabled(item) for item in model.options" ' +
                                'ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired">';

                            var hiddenAttr = clmn.dataNoEmptyOption && !clmn.dataPlaceholder ? ' style="display: none" ' : '';
                            var disableAttr = clmn.dataNoEmptyOption ? ' disabled ' : '';
                            var placeholderAttr = clmn.dataPlaceholder ? ' translate="' + clmn.dataPlaceholder + '" ' : '';
                            field += '<option value="" ' + hiddenAttr + disableAttr + placeholderAttr + '></option>';
                            field += '</select>';
                            break;
                        case 'boolean':
                            var booleanTitle = _embedded ? ' <span translate="' + clmn.title + '"></span>' : '';
                            field += '<div class="checkbox"><label><input type="checkbox" id="' + clmn.field + '" name="' + clmn.field +
                                '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"/>' +
                                '<i class="chk-box"></i>' + booleanTitle + '</label></div>';
                            break;
                        default:
                            field += '<input type="text" class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired"/>';
                        }
                    }

                    if (clmn.dataRequired === true) {
                        if (!_embedded) {
                            field += '<div class="text-center" ng-messages="dataForm.' + clmn.field + '.$error" role="alert" ng-if="$parent.dataForm.' + clmn.field + '.$dirty && !$parent.dataForm.' + clmn.field + '.$viewValue"><span class="help-block" translate="FORMS.FIELD_REQUIRED"></span></div>';
                        }
                    }

                    if (!_embedded) {
                        field += '</div>';
                    }

                    elem.append(field);
                    $compile(elem.contents())(scope);
                }

                function _compileCellTemplate(template, ext) {
                    scope.row = scope.modalFormRec;
                    scope.cell = scope.modalFormFieldModel;
                    scope.ext = ext;
                    var elem = $compile('<span>' + template + '</span>')(scope);
                    return elem.html();
                }

                function _getTemplateByUrl(templateUrl) {
                    return $http.get(templateUrl, {
                            cache: $templateCache
                        })
                        .then(function (response) {
                            return response.data;
                        });
                }
            },
            controller: function formFieldController($scope) {
                var clmn = $scope.modalFormField = _parseParams($scope.modalFormField);

                if (clmn.dataHide) {
                    return;
                }

                $scope.model = {
                    options: [],
                    getDisabled: _getDisabled
                };

                var _options = [];
                if (clmn.dataFormat === 'option') {
                    if (clmn.dataSet.getData) {
                        var data = clmn.dataSet.getData();
                        for (var d = 0; d < data.length; d++) {
                            _options.push(_resolveOption(clmn.dataSet, data[d]));
                        }
                        _setDefaultOption($scope.modalFormRec, clmn.field, _options);
                        $scope.model.options = _options;

                    } else if (clmn.dataSet.dataPromise) {
                        clmn.dataSet.dataPromise($scope.modalFormRec).then(function (data) {
                            _setDefaultOption($scope.modalFormRec, clmn.field, data);
                            $scope.model.options = data;
                        });
                    }
                }

                function _resolveOption(_set, option) {
                    var resolvedOption = {
                        id: option[_set.keyField],
                    };
                    if (_set.valField) {
                        resolvedOption.title = option[_set.valField];
                    } else if (_set.template) {
                        var scope = $scope.$new();
                        scope.option = option;
                        var render = $compile('<span>' + _set.template + '</span>')(scope);
                        $timeout(function () {
                            resolvedOption.title = render.text();
                        });
                    }
                    return resolvedOption;
                }

                function _getDisabled(item) {
                    return (clmn.dataSet && typeof clmn.dataSet.getDisabled === 'function') ?
                        clmn.dataSet.getDisabled(item, $scope.modalFormRec) : false;
                }

                function _parseParams(params) {
                    var parsedParams = angular.copy(params);

                    var fnFields = ['dataReadOnly', 'dataHide'];
                    angular.forEach(fnFields, function (field) {
                        if (typeof params[field] === 'function') {
                            parsedParams[field] = params[field]();
                        }
                    });

                    return parsedParams;
                }

                function _setDefaultOption(model, field, data) {
                    if (clmn.dataNoEmptyOption && data[0] && model[field] === undefined) {
                        model[field] = data[0][clmn.dataSet.keyField];
                    }
                }
            }
        };
    });
