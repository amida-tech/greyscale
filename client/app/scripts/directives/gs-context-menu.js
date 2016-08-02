/**
 * Created by igi on 24.05.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsContextMenu', function (greyscaleSelection, greyscaleUtilsSrv, $timeout, $window) {
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
                    var menu, bottom, right,
                        _offset;

                    if (_hasSelection()) {
                        evt.preventDefault();
                        menu = elem.find('#' + scope.model.menuId);

                        _offset = greyscaleUtilsSrv.getElemOffset(evt.currentTarget);

                        _offset = {
                            left: evt.pageX - _offset.left,
                            top: evt.pageY - _offset.top
                        };

                        right = evt.clientX + menu.outerWidth() + 5;

                        if (right > $window.innerWidth) {
                            _offset.left -= (right - $window.innerWidth);
                        }

                        bottom = evt.clientY + menu.outerHeight() + 5;

                        if (bottom > $window.innerHeight) {
                            _offset.top -= (bottom - $window.innerHeight);
                        }

                        menu.css(_offset);

                        scope.model.data = {
                            range: $window.getSelection().getRangeAt(0),
                            selection: greyscaleSelection.get($window.document.getElementById(scope.qid)),
                            selectedHtml: greyscaleSelection.html()
                        };

                        $timeout(function () {
                            elem.addClass('open');
                        }, 0);
                    }
                }

                function _hasSelection() {
                    var _range = $window.getSelection().getRangeAt(0).cloneRange().toString();
                    return (_range && _range.length > 0);
                }

            }
        };
    });
