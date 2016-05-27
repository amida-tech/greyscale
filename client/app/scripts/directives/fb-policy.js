/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function (greyscaleModalsSrv, greyscaleGlobals, greyscaleCommentApi, $rootScope) {
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
                '<div gs-context-menu="contextMenu" class="gs-contextmenu-wrapper dropdown"><div class="section-text" ng-show="options.readonly" ng-bind-html="model.description"></div></div>' +
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
                    action: function (range) {
                        var _comment = {
                                comment: '<blockquote>' + range.cloneRange().toString() + '</blockquote>',
                                tag: null,
                                commentTypes: greyscaleGlobals.commentTypes,
                                commentAssociate: _associate
                            },
                            _options = {
                                readonly: false
                            };

                        greyscaleModalsSrv.policyComment(_comment, _options)
                            .then(function (data) {
                                data.section = _policy;
                                $rootScope.$broadcast(greyscaleGlobals.events.policy.addComment, data);
                            });
                    }
                }];

                scope.$watch(attrs.ngModel, _setModel);
                scope.$watch('associate', _setAssociate);

                function _setModel() {
                    if (ngModel) {
                        _policy = ngModel.$viewValue;
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
