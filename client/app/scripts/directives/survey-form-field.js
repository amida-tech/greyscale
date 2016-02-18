/**
 * Created by igi on 13.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyFormField', function ($compile, $log) {
        return {
            restrict: 'AE',
            scope: {
                field: '=surveyFormField'
            },
            template: '',
            link: function (scope, elem, attr) {

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

                        var subLeft = '';
                        var subRight = '';
                        var o;

                        switch (scope.field.type) {
                        case 'paragraph':
                            body = '<textarea ' + commonPart + '></textarea>';
                            if (scope.field.minLength){
                                subLeft = 'Min count:' + scope.field.minLength+', ';
                            }
                            if (scope.field.maxLength) {
                                subLeft += 'Max count:' + scope.field.maxLength;
                            }
                            break;

                        case 'section_break':
                            body = '<div id="{{field.cid}}}" class="section-break"><label>{{field.label}}</label></div>';
                            break;

                        case 'text':
                            body = '<input type="text" ' + commonPart + '>';
                            break;

                        case 'number':
                            body = '<input type="number" ' + commonPart + '>';
                            break;

                        case 'email':
                            body = '<input type="email" ' + commonPart + '>';
                            break;

                        case 'checkboxes':
                            if (scope.field.options && scope.field.options.length > 0) {
                                for (o = 0; o < scope.field.options.length; o++) {
                                    angular.extend(scope.field.options[o], {
                                        checked: scope.field.options[o].isSelected,
                                        name: scope.field.options[o].label
                                    });
                                }
                                body += '<checkbox-list list-items = "field.options"></checkbox-list>';
                            }
                            subLeft = '';
                            subRight = '';
                            break;

                        case 'radio':
                            if (scope.field.options && scope.field.options.length > 0) {
                                for (o = 0; o < scope.field.options.length; o++) {
                                    if (scope.field.options[o].isSelected) {
                                        scope.field.answer = scope.field.options[o];
                                    }
                                }
                                body = '<div class="radio" ng-repeat="opt in field.options"><label><input type="radio" ' +
                                    'name="{{field.cid}}" ng-model="field.answer" ng-value="opt"><i class="chk-box"></i>{{opt.label}}</label></div>';
                            }
                            subLeft = '';
                            subRight = '';
                            break;
                        case 'dropdown':
                        case 'price':
                            $log.debug(scope.field);
                            subLeft = '';
                            subRight = '';
                            break;
                        default:
                            $log.debug(scope.field);
                            body = '<input type="text" ' + commonPart + '>';
                        }

                        body = label + body;

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
