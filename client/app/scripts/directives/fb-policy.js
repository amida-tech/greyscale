/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function (greyscaleModalsSrv, greyscaleGlobals, greyscaleSelection, greyscaleCommentApi,
        $rootScope, $log) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                options: '=?',
                associate: '=?'
            },
            template: '<uib-accordion><uib-accordion-group is-open="sectionOpen"><uib-accordion-heading>' +
                '<span translate="{{model.label}}"></span><i class="fa pull-right" ng-class="{\'fa-caret-up\': sectionOpen, ' +
                '\'fa-caret-down\': !sectionOpen}"></i></uib-accordion-heading>' +
                '<text-angular ng-model="model.description" ng-hide="options.readonly"></text-angular>' +
                '<div gs-context-menu="contextMenu" qid="{{model.qid}}" class="gs-contextmenu-wrapper dropdown">' +
                '<div id="{{model.qid}}" class="section-text ta-text" ng-show="options.readonly" ng-bind-html="model.description"></div></div>' +
                '</uib-accordion-group></uib-accordion>',
            link: function (scope, elem, attrs, ngModel) {
                var _policy, _associate;

                scope.sectionOpen = false;
                scope.model = {
                    label: '',
                    description: ''
                };

                scope.contextMenu = [{
                    title: 'CONTEXT_MENU.COMMENT',
                    action: function (data) {
                        var _comment = {
                            section: scope.model,
                            quote: data.range.cloneRange().toString(),
                            range: greyscaleSelection.get(document.getElementById(scope.model.qid))
                        };
                        $rootScope.$broadcast(greyscaleGlobals.events.policy.addComment, _comment);
                    }
                }];

                scope.$watch(attrs.ngModel, _setModel);
                scope.$watch('associate', _setAssociate);

                function _setModel() {
                    if (ngModel) {
                        _policy = ngModel.$viewValue;
                        _policy.qid = _policy.qid || ('Q' + _policy.id);
                        scope.model = _policy;
                    }
                }

                function _setAssociate(associateData) {
                    if (associateData) {
                        _associate = associateData;
                    }
                }
            }
        };
    });
