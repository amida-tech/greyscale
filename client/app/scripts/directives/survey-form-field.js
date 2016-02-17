/**
 * Created by igi on 13.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyFormField', function ($compile, $log) {
        return {
            restrict: 'A',
            scope: {
                field: '=surveyFormField',
                answers: '=?'
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
                            '">{{field.label}}</label>';

                        var commonPart = 'id="{{field.cid}}" class="form-control" ng-model="answers[field.cid]" ng-required="{{field.required}}"';

                        var subLeft = 'Left sub';
                        var subRight = 'Right sub';

                        switch (scope.field.type) {
                        case 'paragraph':
                            body = label + '<textarea ' + commonPart + '></textarea>';
                            break;

                        case 'section_break':
                            body = '<div id="{{field.cid}}}" class="section-break"><label>{{field.label}}</label></div>';
                            break;

                        case 'text':
                            body = label + '<input type="text" ' + commonPart + '>';
                            break;

                        case 'number':
                            body = label + '<input type="number" ' + commonPart + '>';
                            break;

                        case 'email':
                            body = label + '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                            $log.debug(scope.field);
                            body += label;
                            if (scope.field.options && scope.field.options.length > 0) {
                                for (var o=0; o<scope.field.options.length; o++) {
                                    angular.extend(scope.field.options[o], {
                                        checked: scope.field.options[o].isSelected,
                                        name: scope.field.options[o].label
                                    });
                                }
                                body +='<checkbox-list list-items = "field.options"></checkbox-list>';
                            }
                            subLeft = '';
                            subRight = '';
                            break;

                        case 'radio':
                            $log.debug(scope.field);
                            subLeft = '';
                            subRight = '';
                            break;
                        case 'dropdown':
                        case 'price':
                            body = label;
                            $log.debug(scope.field);
                            subLeft = '';
                            subRight = '';
                            break;
                        default:
                            $log.debug(scope.field);
                            body = label + '<input type="text" ' + commonPart + '>';
                        }

                        if (subLeft || subRight) {
                            body += '<p class="subtext"><span class="pull-right">' + subRight +
                                '</span><span class="pull-left">' + subLeft + '</span></p>';
                        }
                    }

                    elem.append(body);

                    $compile(elem.contents())(scope);
                }
            }
        };
    });
