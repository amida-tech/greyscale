/**
 * Created by igi on 24.05.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsContextMenu', function (greyscaleSelection, $timeout, $log) {
        return {
            restrict: 'A',
            transclude: true,
            scope: {
                gsContextMenu: '=',
                qid: '@'
            },
            templateUrl: 'views/directives/gs-context-menu.html',
            link: function (scope, elem) {
                scope.model = {
                    menuId: 'mnu_' + new Date().getTime(),
                    data: {
                        range: null,
                        selection: {}
                    }
                };

                elem.on('mousedown', function (evt) {
                    var _parent = evt.target.parentNode ? evt.target.parentNode.parentNode : null;
                    if (!_parent || _parent.id !== scope.model.menuId) {
                        window.getSelection().collapse(evt.target.parentNode, 0);
                    }
                });

                elem.on('mouseup', _showContextMenu);

                elem.on('contextmenu', _showContextMenu);

                function _showContextMenu(evt) {
                    var node, x, y, menu, bottom, right,
                        limit = 1000;

                    if (_hasSelection()) {
                        evt.preventDefault();
                        node = evt.target;
                        x = evt.offsetX;
                        y = evt.offsetY;

                        while (node && limit && node !== evt.currentTarget) {
                            limit--;
                            if (node.nodeName !== 'TR') {
                                x += node.offsetLeft;
                                y += node.offsetTop;
                            }
                            node = node.offsetParent || node.parentNode;
                        }
                        scope.model.data = {
                            range: window.getSelection().getRangeAt(0),
                            selection: greyscaleSelection.get(document.getElementById(scope.qid)),
                            selectedHtml: _getSelectedHtml()
                        };

                        menu = elem.find('#' + scope.model.menuId);
                        right = evt.clientX + menu.outerWidth() + 5;

                        if (x + menu.width > window.innerWidth) {
                            x -= (right - window.innerWidth);
                        }

                        bottom = evt.clientY + menu.outerHeight() + 5;

                        if (bottom > window.innerHeight) {
                            y -= (bottom - window.innerHeight);
                        }

                        menu.css({
                            left: x,
                            top: y
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

                function _getSelectedHtml() {
                    var html = '';
                    if (typeof window.getSelection !== 'undefined') {
                        var sel = window.getSelection();
                        if (sel.rangeCount) {
                            var container = document.createElement('div');
                            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                                container.appendChild(sel.getRangeAt(i).cloneContents());
                            }
                            html = container.innerHTML;
                        }
                    } else if (typeof document.selection !== 'undefined') {
                        if (document.selection.type === 'Text') {
                            html = document.selection.createRange().htmlText;
                        }
                    }
                    return html;
                }
            }
        };
    });
