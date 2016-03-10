/**
 * Created by igi on 13.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyFormField', function ($compile, i18n, greyscaleModalsSrv, $log) {
    
    return {
        restrict: 'AE',
        scope: {
            field: '=surveyFormField'
        },
        template: '',
        link: function (scope, elem) {
            scope.showVersion = function (field) {
                greyscaleModalsSrv.showVersion({
                    field: field
                }).then(function (model) { });
            };
            
            if (scope.field) {
                var body = '';
                if (scope.field.sub) {
                    scope.sectionOpen = false;
                    scope.model = scope.field.sub;
                    
                    body = '<uib-accordion><uib-accordion-group is-open="sectionOpen"><uib-accordion-heading>' +
                            '<span class="' + (scope.field.required ? 'required' : '') + '">{{field.label}}</span>' +
                            '<i class="fa pull-right" ng-class="{\'fa-caret-up\': sectionOpen, ' +
                            '\'fa-caret-down\': !sectionOpen}"></i></uib-accordion-heading><div class="form-group" ' +
                            'ng-repeat="fld in model" survey-form-field="fld"></div></uib-accordion-group></uib-accordion>';
                } else {
                    var label = '<label id="{{field.cid}}" class="' + (scope.field.required ? 'required' : '') +
                            '">{{field.qid}}. {{field.label}}</label><p class="subtext">{{field.description}}</p>';
                    if (!scope.field.blindReview && !scope.field.provideResponses) {
                        label = '<a class="fa fa-users version-button" ng-click="showVersion(field)" title="{{\'SURVEYS.VERSION\' | translate}}"></a> ' + label;
                    }
                    
                    var commonPart = ' name="{{field.cid}}" class="form-control" ng-model="field.answer" ng-required="{{field.required}}" ng-readonly="{{!field.flags.allowEdit}}" ';
                    
                    var borders = getBorders(scope.field);
                    var message = '<span ng-if ="field.ngModel.$error.required" translate="FORMS.FIELD_REQUIRED"></span>';
                    var links = '';
                    var attach = '';
                    
                    switch (scope.field.type) {
                        case 'paragraph':
                        case 'text':
                            if (scope.field.type === 'text') {
                                body = '<input type="text" ';
                            } else {
                                body = '<textarea ';
                            }
                            
                            body += commonPart + ' gs-length="field">';
                            
                            if (scope.field.type === 'paragraph') {
                                body += '</textarea>';
                            }
                            
                            message = i18n.translate('SURVEYS.CURRENT_COUNT') + ': {{field.length}} {{field.lengthMeasure}}';
                            break;

                        case 'section_break':
                            label = '';
                            borders = '';
                            message = '';
                            body = '<div id="{{field.cid}}}" class="section-break"><label>{{field.label}}</label></div>';
                            break;

                        case 'number':
                            body = '<div class="input-group"><input type="number" ' + commonPart +
                                ' min="{{field.minLength}}" max="{{field.maxLength}}" gs-int="field">' +
                                '<span class="input-group-addon" ng-show="field.units">{{field.units}}</span></div>';
                            
                            message += '<span ng-if="field.ngModel.$error.integer" translate="FORMS.MUST_BE_INT"></span>' +
                                '<span ng-if="field.ngModel.$error.number" translate="FORMS.MUST_BE_NUMBER"></span>';
                            
                            break;

                        case 'scale':
                            body = '<div class="input-group"><input type="range" ' + commonPart + (!scope.field.intOnly ? ' step="0.0001"' : '') +
                                ' min="{{field.minLength}}" max="{{field.maxLength}}" gs-valid="field">' +
                                '<span class="input-group-addon" ng-show="field.units">{{field.units}}</span></div>';
                            
                            message += '<span ng-show="field.answer">' + i18n.translate('COMMON.CURRENT_VALUE') + ': {{field.answer}}</span>';
                            
                            break;

                        case 'email':
                            body = '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                            scope.selectedOpts = function (_field) {
                                var res = (_field.withOther && _field.otherOption && _field.otherOption.checked);
                                var o, qty = _field.options.length;
                                
                                for (o = 0; o < qty && !res; o++) {
                                    res = res || _field.options[o].checked;
                                }
                                return res;
                            };
                            
                            body += '<div class="checkbox-list option-list" ng-class="field.listType">';
                            
                            if (scope.field.options && scope.field.options.length > 0) {
                                body += '<div ng-repeat="opt in field.options"><div class="checkbox">' +
                                    '<label><input type="checkbox" ng-model="opt.checked" ng-disabled="{{!field.flags.allowEdit}}" ' +
                                    'ng-required="field.required && !selectedOpts(field)" gs-valid="field">' +
                                    '<div class="chk-box"></div><span class="survey-option">{{opt.label}}</span></label></div></div>';
                            }
                            
                            if (scope.field.withOther) {
                                body += '<div class="input-group"><span class="input-group-addon"><div class="checkbox">' +
                                    '<label><input type="checkbox" ng-model="field.otherOption.checked" ng-disabled="{{!field.flags.allowEdit}}" ' +
                                    'ng-required="field.required && !selectedOpts(field)" gs-valid="field">' +
                                    '<div class="chk-box"></div></label></div></span>' +
                                    '<input type="text" class="form-control" ng-model="field.otherOption.value" ng-readonly="{{!field.flags.allowEdit}}">{{}}</div>';
                            }
                            body += '</div>';
                            break;

                        case 'radio':
                            body += '<div class="checkbox-list option-list" ng-class="field.listType">';
                            if (scope.field.options && scope.field.options.length > 0) {
                                body = '<div class="radio" ng-repeat="opt in field.options"><label><input type="radio" ' +
                                    'name="{{field.cid}}" ng-model="field.answer" ng-required="field.required" ng-disabled="{{!field.flags.allowEdit}}"' +
                                    ' ng-value="opt" gs-valid="field"><i class="chk-box"></i>' +
                                    '<span class="survey-option">{{opt.label}}</span></label></div></div>';
                            }
                            if (scope.field.withOther) {
                                body += '<div class="input-group"><span class="input-group-addon"><div class="radio">' +
                                    '<label><input type="radio" ng-model="field.answer" ng-disabled="{{!field.flags.allowEdit}}" ' +
                                    'ng-required="field.required" name="{{field.cid}}" gs-valid="field" ng-value="field.otherOption">' +
                                    '<div class="chk-box"></div></label></div></span>' +
                                    '<input type="text" class="form-control" ng-model="field.otherOption.value" ng-readonly="{{!field.flags.allowEdit}}"></div>';
                            }
                            body += '</div>';
                            break;

                        case 'dropdown':
                            if (scope.field.options && scope.field.options.length > 0) {
                                body = '<select ' + commonPart + 'ng-options="opt as opt.label for opt in field.options"' +
                                    ' gs-valid="field" ng-readonly="{{!field.flags.allowEdit}}">';
                                if (scope.field.required) {
                                    body += '<option disabled="disabled" class="hidden" selected value="" translate="SURVEYS.SELECT_ONE"></option>';
                                }
                                body += '</select>';
                            }
                            break;

                        case 'date':
                            scope.field.options = {
                                readonly: !scope.field.flags.allowEdit,
                                disabled: !scope.field.flags.allowEdit,
                                required: scope.field.required
                            };
                            
                            body = '<select-date data-id="' + scope.field.cid + '" result="field.answer" validator="field"' +
                                'form-field-value="' + scope.field.cid + '" options="field.options"></select-date>';

                            message += '<span ng-if ="field.ngModel.$error.date" translate="FORMS.WRONG_DATE_FORMAT"></span>';
                            break;

                        case 'bullet_points':
                            scope.field.options = {
                                readonly: !scope.field.flags.allowEdit,
                                disabled: !scope.field.flags.allowEdit,
                                required: scope.field.required
                            };

                            body = '<bullets bullet-field="field"></bullets-field>';
                            break;

                        default:
                            $log.debug('not rendered', scope.field);
                            body = '<p class="subtext error">field type "{{field.type}}" rendering is not implemented yet</p>';
                    }
                    
                    if (scope.field.links) {
                        links = '<div><p translate="SURVEYS.LINKS"></p></div>';
                    }
                    
                    if (scope.field.canAttach) {
                            attach = '<attachments model="field.attachments" answer-id="{{field.answerId}}"></attachments>';
                    }
                    body = label + body + '<p class="subtext"><span class="pull-right" ng-class="{error:field.ngModel.$invalid }">' +
                            message + '</span><span class="pull-left">' + borders + '</span></p>' + attach;
                }
                elem.append(body);
                
                $compile(elem.contents())(scope);
            }
        }
    };
    
    function getBorders(field) {
        var borders = [];
        var suffix = '';
        var supportedTypes = ['number', 'paragraph', 'text', 'scale'];
        var numericTypes = ['number', 'scale'];
        
        if (angular.isNumber(field.minLength) && angular.isNumber(field.maxLength) && field.maxLength < field.minLength) {
            field.maxLength = null;
        }
        field.lengthMeasure = i18n.translate('COMMON.' + (field.inWords ? 'WORDS' : 'CHARS'));
        
        if (supportedTypes.indexOf(field.type) !== -1) {
            if (numericTypes.indexOf(field.type) === -1) {
                suffix = ' ' + field.lengthMeasure;
            }
            if (field.minLength !== null && field.minLength >= 0) {
                borders.push('<span ng-class="{error: field.ngModel.$error.min}">' + i18n.translate('SURVEYS.MIN') +
                        ': ' + field.minLength + suffix + '</span>');
            }
            if (field.maxLength !== null && field.maxLength >= 0) {
                borders.push('<span ng-class="{error: field.ngModel.$error.max}">' + i18n.translate('SURVEYS.MAX') +
                        ': ' + field.maxLength + suffix + '</span>');
            }
        }
        
        return borders.join(', ');
    }
});
