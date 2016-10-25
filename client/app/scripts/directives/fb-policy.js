/**
 * Created by igi on 07.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fbPolicy', function (greyscaleModalsSrv, greyscaleGlobals, greyscaleSelection, greyscaleCommentApi,
        $rootScope, $sce) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                options: '=?',
                associate: '=?',
                author: '=?'
            },
            templateUrl: 'views/directives/fb-policy.html',
            link: function (scope, elem, attrs, ngModel) {
                var _policy, _associate;

                scope.sectionOpen = false;
                scope.model = {
                    label: '',
                    description: ''
                };

                _setContextMenu();

                scope.$watch(attrs.ngModel, _setModel);
                scope.$watch('associate', _setAssociate);

                scope.getHtml = function (html) {
                    return $sce.trustAsHtml(html);
                };

                function _setModel() {
                    if (ngModel) {
                        _policy = ngModel.$viewValue;
                        _policy.qid = 'Q' + _policy.id;
                        _policy.sectionOpen = !!_policy.sectionOpen;
                        scope.model = _policy;

                        _setContextMenu();
                    }
                }

                function _setContextMenu() {
                    if (scope.options && scope.options.canComment) {
                        scope.contextMenu = [{
                            title: 'CONTEXT_MENU.COMMENT',
                            action: function (data) {
                                var _comment = {
                                    section: scope.model,
                                    quote: data.selectedHtml,
                                    range: data.selection,
                                    policyAuthor: scope.author
                                };
                                $rootScope.$broadcast(greyscaleGlobals.events.policy.addComment, _comment);
                            }
                        }];
                    } else {
                        scope.contextMenu = null;
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
