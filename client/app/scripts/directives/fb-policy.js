/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function ($log) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {},
            template: '<uib-accordion><uib-accordion-group is-open="sectionOpen"><uib-accordion-heading>' +
            '<span translate="{{model.label}}"></span><i class="fa pull-right" ng-class="{\'fa-caret-up\': sectionOpen, ' +
            '\'fa-caret-down\': !sectionOpen}"></i></uib-accordion-heading>' +
//            '<textarea class="fb-editor form-control" ng-model="model.description"></textarea>' +
            '<text-angular ng-model="model.description"></text-angular>' +
            '</uib-accordion-group></uib-accordion>',
            link: function (scope, elem, attrs, ngModel) {
                scope.sectionOpen = false;
                scope.model = {
                    label: 'label',
                    description: 'test data'
                };

                scope.$watch(attrs.ngModel, _setModel);

                function _setModel() {
                    if (ngModel) {
                        scope.model = ngModel.$viewValue;
                    }
                }
            }
        };
    });
