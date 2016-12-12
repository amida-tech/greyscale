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

                //elem.on('mouseenter', _fixSelection);

                elem.on('mouseup', _showContextMenu);

                elem.on('contextmenu', _showContextMenu);

                function _fixSelection(e) {
                    var _selection = $window.getSelection(),
                        _range, _start, _end, _container,
                        rangeChanged = false;

                    if (_hasSelection()) {
                        _container = $window.document.getElementById(scope.qid);
                        _range = $window.getSelection().getRangeAt(0).cloneRange();
                        _start = _range.startContainer;
                        _end = _range.endContainer;

                        if (!_isChild(_container, _start)) {
                            if (_container.firstChild) {
                                _range.setStart(_container.firstChild, 0);
                            } else {
                                _range.setStart(_container, 0);

                            }
                            rangeChanged = true;
                        }

                        if (!_isChild(_container, _end)) {
                            if (_container.lastChild) {
                                _range.setEnd(_container.lastChild, 0);
                            } else {
                                _range.setEnd(_container, 0);
                            }
                            rangeChanged = true;
                        }

                        if (rangeChanged) {
                            _hideContextMenu();
                            _selection.removeAllRanges();
                            _selection.addRange(_range);
                        }
                    }
                }

                function _isChild(container, elem) {
                    var node = elem.parentNode;
                    while (node && node !== container) {
                        node = node.parentNode;
                    }
                    return node === container;
                }

                function _hideContextMenu() {
                    scope.model.data = {
                        range: null,
                        selection: '',
                        selectedHtml: ''
                    };

                    $timeout(function () {
                        elem.removeClass('open');
                    }, 0);
                }

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
                            selectedHtml: greyscaleSelection.html(true)
                        };

                        $timeout(function () {
                            elem.addClass('open');
                        }, 0);
                    }
                }

                function _hasSelection() {
                    if (window.getSelection().rangeCount) {
                        var _range = $window.getSelection().getRangeAt(0).cloneRange().toString();
                        return (_range && _range.length > 0);
                    } else {
                        return false;
                    }
                }
            }
        };
    });
