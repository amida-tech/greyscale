/**
 * Created by igi on 24.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('modalFormField', function ($compile, $timeout, greyscaleUtilsSrv, $templateCache, $http, gsModelValidators, $translate) {
        return {
            restrict: 'A',
            scope: {
                modalFormRec: '=',
                modalFormField: '=',
                modalFormFieldModel: '='
            },
            require: '^form',
            link: function (scope, elem, attr, ngForm) {

                var clmn = scope.modalFormField;

                if (clmn.dataHide) {
                    elem.remove();
                    return;
                }

                var editMode = !!(scope.modalFormRec.id);

                var _embedded = !!attr.embedded;

                if (!(clmn.viewMode && clmn.viewHide) && (clmn.title || (clmn.viewMode && (clmn.cellTemplate || clmn.cellTemplateUrl)))) {
                    var field = '';
                    var colon = !clmn.title || clmn.title === '' ? '' : ':';

                    var fieldTitle = $translate.instant(clmn.title);

                    if (!_embedded) {
                        elem.append('<label for="' + clmn.field + '" class="col-sm-3 control-label" ng-class="{required:modalFormField.dataRequired}">' +
                            fieldTitle + colon + '</label>');
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
                                '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired" ng-change="fieldChange(modalFormRec, \'' + clmn.field + '\')" gs-model-validate="modalFormField.dataValidate" ></textarea>';
                            break;
                        case 'date':
                            field += '<select-date data-id="' + clmn.field + '" ' +
                                'result="modalFormFieldModel" form-field-value="$parent.dataForm.' + clmn.field + '" ' +
                                (_embedded ? ' embedded ' : '') +
                                'ng-required="modalFormField.dataRequired" on-change="fieldChange(modalFormRec, \'' + clmn.field + '\')"></select-date><input type="hidden" ng-model="modalFormFieldModel" gs-model-validate="modalFormField.dataValidate">';
                            if (!_embedded) {
                                field += '<div class="text-center" role="alert" ng-if="$parent.dataForm.' + clmn.field + '.$dirty && $parent.dataForm.' + clmn.field + '.$error.date"><span class="help-block" translate="FORMS.WRONG_DATE_FORMAT"></span></div>';
                            }
                            break;
                        case 'option':
                            var grouping = clmn.dataSet.groupBy ? 'group by item.group ' : '';

                            field += '<select class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ' +
                                'ng-options="item.id as item.title ' + grouping + 'disable when model.getDisabled(item) for item in model.options" ' +
                                'ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired" ng-change="fieldChange(modalFormRec, \'' + clmn.field + '\')" gs-model-validate="modalFormField.dataValidate">';

                            var hiddenAttr = clmn.dataNoEmptyOption && !clmn.dataPlaceholder ? ' style="display: none" ' : '';
                            var disableAttr = clmn.dataNoEmptyOption || clmn.dataPlaceholder ? ' disabled ' : '';
                            var placeholderAttr = clmn.dataPlaceholder ? ' translate="' + clmn.dataPlaceholder + '" ' : '';
                            field += '<option value="" ' + hiddenAttr + disableAttr + placeholderAttr + '></option>';
                            field += '</select>';
                            break;
                        case 'boolean':
                            var booleanTitle = _embedded ? ' <span translate="' + clmn.title + '"></span>' : '';
                            field += '<div class="checkbox"><label><input type="checkbox" id="' + clmn.field + '" name="' + clmn.field +
                                '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired" ng-change="fieldChange(modalFormRec, \'' + clmn.field + '\')" gs-model-validate="modalFormField.dataValidate"/>' +
                                '<i class="chk-box"></i>' + booleanTitle + '</label></div>';
                            break;
                        case 'password':
                            field += '<input type="password" class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired" ng-change="fieldChange(modalFormRec, \'' + clmn.field + '\')" gs-model-validate="modalFormField.dataValidate"/>';
                            break;

                        default:
                            field += '<input type="text" class="form-control" id="' + clmn.field + '" name="' + clmn.field + '" ng-model="modalFormFieldModel" ng-required="modalFormField.dataRequired" ng-change="fieldChange(modalFormRec, \'' + clmn.field + '\')" gs-model-validate="modalFormField.dataValidate"/>';
                        }
                    }

                    if (!_embedded && (clmn.dataRequired === true || clmn.dataValidate)) {
                        field += '<div class="text-center" ng-messages="$parent.dataForm.' + clmn.field + '.$error" role="alert" >';
                        if (clmn.dataRequired === true) {
                            field += '<span ng-if="$parent.dataForm.' + clmn.field + '.$dirty" ng-message="required" class="help-block"><span translate="FORMS.FIELD_REQUIRED"></span></span>';
                        }
                        if (clmn.dataValidate) {
                            var validators = gsModelValidators.parse(clmn.dataValidate);
                            angular.forEach(validators, function (validator) {
                                var translationKey = 'FORMS.INVALID_' + validator.key.toUpperCase();
                                field += '<span ng-message="' + validator.key + '" class="help-block"><span translate="' + translationKey + '" translate-values="{field: \'' + fieldTitle + '\'}"></span></span>';
                            });
                        }
                        field += '</div>';
                    }

                    if (!_embedded) {
                        field += '</div>';
                    }

                    elem.append(field);
                    $compile(elem.contents())(scope);

                }

                function _addValidator(ngModel, validate) {
                    ngModel.$parsers.unshift(function(value){
                        var valid = validate.isValid($scope.modalFormRec);
                        ngModel.$setValidity(validate.key, valid);
                        return valid ? value : undefined;
                    });
                    ngModel.$formatters.unshift(function(value) {
                        var valid = validate.isValid($scope.modalFormRec);
                        ngModel.$setValidity(validate.key, valid);
                        return value;
                    });
                }

                scope.fieldChange = function (row, field) {
                    $timeout(function () {
                        scope.$emit('form-field-change', {
                            record: row,
                            field: field
                        });
                    });
                };

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
                        setDatasetOptions(clmn.dataSet, clmn.dataSet.getData() || []);
                    } else if (clmn.dataSet.dataPromise) {
                        clmn.dataSet.dataPromise($scope.modalFormRec).then(function (data) {
                            setDatasetOptions(clmn.dataSet, data);
                        });
                    }
                }

                function setDatasetOptions(dataset, data) {
                    var d,
                        qty = data.length,
                        _options = [];
                    for (d = 0; d < qty; d++) {
                        _options.push(_resolveOption(clmn.dataSet, data[d]));
                    }
                    _setDefaultOption($scope.modalFormRec, clmn.field, data);
                    $scope.model.options = _options;
                }

                function _resolveOption(_set, option) {
                    var resolvedOption = {
                        id: option[_set.keyField]
                    };
                    if (typeof _set.groupBy === 'function') {
                        resolvedOption.group = _set.groupBy(option);
                    } else if (_set.groupBy) {
                        resolvedOption.group = option[_set.groupBy];
                    }
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
                            parsedParams[field] = params[field]($scope.modalFormRec);
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
