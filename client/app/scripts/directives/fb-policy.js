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
                        var _selection = greyscaleSelection.get(document.getElementById(scope.model.qid));

                        var _comment = {
                                comment: '<blockquote>' + data.range.cloneRange().toString() + '</blockquote>',
                                tag: null,
                                commentTypes: greyscaleGlobals.commentTypes,
                                commentAssociate: _associate
                            },
                            _options = {
                                readonly: false
                            };

                        greyscaleModalsSrv.policyComment(_comment, _options)
                            .then(function (comment_body) {
                                angular.extend(comment_body, {
                                    section: _policy,
                                    range: JSON.stringify(data.selection),
                                    activated: true
                                });

                                $rootScope.$broadcast(greyscaleGlobals.events.policy.addComment, comment_body);
                            });
                    }
                }];

                scope.$watch(attrs.ngModel, _setModel);
                scope.$watch('associate', _setAssociate);

                function _setModel() {
                    if (ngModel) {
                        _policy = ngModel.$viewValue;
                        _policy.qid = _policy.qid || ('Q'+ _policy.id);
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
