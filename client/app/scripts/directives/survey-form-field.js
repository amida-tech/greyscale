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
                            $log.debug(scope.field);
                            body = label + '<input type="number" ' + commonPart + '>';
                            break;

                        case 'email':
                            $log.debug(scope.field);
                            body = label + '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                        case 'radio':

                        case 'dropdown':
                        case 'price':
                            body = label;
                            $log.debug(scope.field);

                            break;
                        default:
                            $log.debug(scope.field);
                            body = label + '<input type="text" ' + commonPart + '>';
                        }

                        body += '<p class="subtext"><span class="pull-right">' + subRight +
                            '</span><span class="pull-left">' + subLeft + '</span></p>';
                    }

                    elem.append(body);

                    $compile(elem.contents())(scope);
                }
            }
        };
    });
