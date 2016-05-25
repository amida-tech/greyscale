/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function (greyscaleModalsSrv) {
        var _policyContextMenu = [{
            title: 'CONTEXT_MENU.COMMENT',
            action: function (range) {
                var _comment = {
                    comment: '<blockquote>' + range.cloneRange().toString() + '</blockquote>',
                    commentTypes: [],
                    commentAssociate: []
                };

                greyscaleModalsSrv.policyComment(_comment, {readonly: false})
                    .then(function(data){
                        $log.debug('data 2 save', data)
                    });
            }
        }];

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

            '<div gs-context-menu="contextMenu" class="gs-contextmenu-wrapper dropdown"><div class="section-text" ng-show="options.readonly" ng-bind-html="model.description"></div></div>' +
            '</uib-accordion-group></uib-accordion>',
            link: function (scope, elem, attrs, ngModel) {
                scope.sectionOpen = false;
                scope.model = {
                    label: '',
                    description: ''
                };

                scope.contextMenu = _policyContextMenu;

                scope.$watch(attrs.ngModel, _setModel);

                function _setModel() {
                    if (ngModel) {
                        scope.model = ngModel.$viewValue;
                    }
                }
            }
        };
    });
