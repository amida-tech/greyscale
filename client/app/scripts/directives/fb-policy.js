/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function () {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                options: '='
            },
            template: '<uib-accordion><uib-accordion-group is-open="sectionOpen"><uib-accordion-heading>' +
                '<span translate="{{model.label}}"></span><i class="fa pull-right" ng-class="{\'fa-caret-up\': sectionOpen, ' +
                '\'fa-caret-down\': !sectionOpen}"></i></uib-accordion-heading>' +
                '<text-angular ng-model="model.description" ng-hide="options.readonly"></text-angular>' +
                '<div class="section-text" ng-show="options.readonly" ng-bind-html="model.description"></div>' +
                '</uib-accordion-group></uib-accordion>',
            link: function (scope, elem, attrs, ngModel) {
                scope.sectionOpen = false;
                scope.model = {
                    label: '',
                    description: ''
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
