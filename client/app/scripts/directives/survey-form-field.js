/**
 * Created by igi on 13.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyFormField', function ($compile, i18n, $log, greyscaleModalsSrv) {
    function getBorders(field) {
        var borders = [];
        var suffix = '';

        if (angular.isNumber(field.minLength) && angular.isNumber(field.maxLength) && field.maxLength < field.minLength) {
            field.maxLength = null;
        }
        field.lengthMeasure = i18n.translate('COMMON.' + (field.inWords ? 'WORDS' : 'CHARS'));

        if (['number', 'paragraph', 'text'].indexOf(field.type) !== -1) {
            if (field.type !== 'number') {
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
                }).then(function (model) {
                });
            }

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
                    label = '<a class="fa fa-users version-button" ng-click="showVersion(field)" title="{{\'SURVEYS.VERSION\' | translate}}"></a> ' + label;

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

                        case 'email':
                            body = '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                            scope.selectedOpts = function (options) {
                                var res = false;
                                for (var o = 0; o < options.length && !res; o++) {
                                    res = res || options[o].checked;
                                }
                                return res;
                            };

                            if (scope.field.options && scope.field.options.length > 0) {
                                body += '<div class="checkbox-list option-list" ng-class="field.listType">' +
                                    '<div ng-repeat="opt in field.options"><div class="checkbox">' +
                                    '<label><input type="checkbox" ng-model="opt.checked" ng-disabled="{{!field.flags.allowEdit}}" ' +
                                    'ng-required="field.required && !selectedOpts(field.options)" gs-valid="field">' +
                                    '<div class="chk-box"></div><span class="survey-option">{{opt.label}}</span></label></div></div>';
                            }
                            break;

                        case 'radio':
                            if (scope.field.options && scope.field.options.length > 0) {
                                body = '<div class="checkbox-list option-list" ng-class="field.listType">' +
                                    '<div class="radio" ng-repeat="opt in field.options"><label><input type="radio" ' +
                                    'name="{{field.cid}}" ng-model="field.answer" ng-required="field.required" ng-disabled="{{!field.flags.allowEdit}}"' +
                                    ' ng-value="opt" gs-valid="field"><i class="chk-box"></i>' +
                                    '<span class="survey-option">{{opt.label}}</span></label></div></div>';
                            }
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

                            body = '<select-date data-id="' + scope.field.cid + '" result="field.answer" ' +
                                'form-field-value="' + scope.field.cid + '" options="field.options"></select-date>';
                            break;

                        default:
                            body = '<p class="subtext error">field type "{{field.type}}" rendering is not implemented yet</p>';
                    }

                    if (scope.field.links) {
                        links = '<div><p translate="SURVEYS.LINKS"></p></div>';
                    }

                    if (scope.field.canAttach) {
                        attach = '<attachments model="field.attachments"></attachments>';
                    }
                    body = label + body + '<p class="subtext"><span class="pull-right" ng-class="{error:field.ngModel.$invalid }">' +
                            message + '</span><span class="pull-left">' + borders + '</span></p>' + attach;
                }
                elem.append(body);

                $compile(elem.contents())(scope);
            }
        }
    };
});
