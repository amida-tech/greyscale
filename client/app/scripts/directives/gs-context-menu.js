/**
 * Created by igi on 24.05.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsContextMenu', function (greyscaleSelection, $timeout) {
        return {
            restrict: 'A',
            transclude: true,
            scope: {
                gsContextMenu: '=',
                qid: '@'
            },
            template: '<ng-transclude></ng-transclude><ul data-toggle="dropdown" id="{{model.menuId}}" class="dropdown-menu" role="menu">' +
                '<li class="dropdown-header" translate="CONTEXT_MENU.TITLE"></li><li class="divider"></li>' +
                '<li ng-repeat="item in gsContextMenu"><a translate="{{item.title}}" ng-click="item.action(model.data)"></a></li></ul>',
            link: function (scope, elem) {
                scope.model = {
                    menuId: 'mnu_' + new Date().getTime(),
                    data: {
                        range: null,
                        selection: {}
                    }
                };

                elem.on('mousedown', function (evt) {
                    window.getSelection().collapse(true);
                    var _parent = evt.target.parentNode? evt.target.parentNode.parentNode : null;
                    if (!_parent || _parent.id !== scope.model.menuId) {
                        window.getSelection().collapse(true);
                    }
                });

                elem.on('mouseup', _showContextMenu);

                elem.on('contextmenu', _showContextMenu);

                function _showContextMenu(evt) {
                    if (_hasSelection()) {
                        evt.preventDefault();
                        scope.model.data = {
                            range: window.getSelection().getRangeAt(0),
                            selection: greyscaleSelection.get(document.getElementById(scope.qid))
                        };

                        elem.find('#' + scope.model.menuId)
                            .css({
                                left: evt.offsetX,
                                top: evt.offsetY
                            });

                        $timeout(function () {
                            elem.addClass('open');
                        }, 0);
                    }
                }

                function _hasSelection() {
                    var _range = window.getSelection().getRangeAt(0).cloneRange().toString();
                    return (_range && _range.length > 0);
                }
            }
        };
    });
