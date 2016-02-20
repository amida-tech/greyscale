/**
 * Created by igi on 13.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyFormField', function ($compile, i18n, $log) {
        function getBorders(field) {
            var borders = [];

            if (angular.isNumber(field.minLength) && angular.isNumber(field.maxLength) && field.maxLength < field.minLength) {
                field.maxLength = null;
            }
            field.lengthMeasure = i18n.translate('COMMON.' + (field.inWords ? 'WORDS' : 'CHARS'));
            switch (field.type) {
            case 'paragraph':
            case 'text':
                var suffix = ' ' + field.lengthMeasure;
                if (field.minLength !== null && field.minLength >= 0) {
                    borders.push(i18n.translate('SURVEYS.MIN') + ': ' + field.minLength + suffix);
                }
                if (field.maxLength !== null && field.maxLength >= 0) {
                    borders.push(i18n.translate('SURVEYS.MAX') + ': ' + field.maxLength + suffix);
                }
                break;

            case 'number':
                if (field.minLength !== null && field.minLength >= 0) {
                    borders.push(i18n.translate('SURVEYS.ABOVE') + ': ' + field.minLength);
                }
                if (field.maxLength !== null && field.maxLength) {
                    borders.push(i18n.translate('SURVEYS.BELOW') + ': ' + field.maxLength);
                }
                break;
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
                        var label = '<label for="{{field.cid}}" class="' + (scope.field.required ? 'required' : '') +
                            '">{{field.label}}</label><p class="subtext">{{field.description}}</p>';

                        var commonPart = 'id="{{field.cid}}" name="{{field.cid}}" class="form-control" ng-model="field.answer" ng-required="{{field.required}}"';

                        var borders = getBorders(scope.field);
                        var message = '';

                        switch (scope.field.type) {
                        case 'paragraph':
                        case 'text':
                            if (scope.field.type === 'text') {
                                body = '<input type="text" ';
                            } else {
                                body = '<textarea ';
                            }

                            body += commonPart + ' gs-length="field" gs-min-length="{{field.minLength}}" gs-max-length="{{field.maxLength}}" gs-in-words="{{field.inWords}}">';

                            if (scope.field.type === 'paragraph') {
                                body += '</textarea>';
                            }

                            message = i18n.translate('SURVEYS.CURRENT_COUNT') + ': {{field.length}} {{field.lengthMeasure}}';
                            break;

                        case 'section_break':
                            body = '<div id="{{field.cid}}}" class="section-break"><label>{{field.label}}</label></div>';
                            break;

                        case 'number':
                            body = '<div class="input-group"><input type="number" ' + commonPart + '><span class="input-group-addon" ng-show="field.units">{{field.units}}</span></div>';
                            break;

                        case 'email':
                            body = '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                            if (scope.field.options && scope.field.options.length > 0) {
                                body += '<checkbox-list list-items = "field.options"></checkbox-list>';
                            }
                            break;

                        case 'radio':
                            if (scope.field.options && scope.field.options.length > 0) {
                                body = '<div class="radio" ng-repeat="opt in field.options"><label><input type="radio" ' +
                                    'name="{{field.cid}}" ng-model="field.answer" ng-value="opt"><i class="chk-box"></i>{{opt.label}}</label></div>';
                            }
                            break;

                        case 'dropdown':
                            if (scope.field.options && scope.field.options.length > 0) {
                                body = '<select ' + commonPart + 'ng-options="opt as opt.label for opt in field.options">';
                                if (scope.field.required) {
                                    body += '<option disabled="disabled" class="hidden" selected value="" translate="SURVEYS.SELECT_ONE"></option>';
                                }
                                body += '</select>';
                            }
                            break;

                        default:
                            $log.debug(scope.field);
                            body = '<input type="text" ' + commonPart + '>';
                        }
                        body = label + body + '<p class="subtext"><span class="pull-right" ng-class="{ \'error\' : !field.valid }">' +
                            message + '</span><span class="pull-left">' + borders + '</span></p>';
                    }

                    elem.append(body);

                    $compile(elem.contents())(scope);
                }
            }
        };
    });
