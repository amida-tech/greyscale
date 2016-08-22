/**
 * Created by igi on 31.05.16.
 */
angular.module('greyscale.core')
    .provider('greyscaleSelection', function () {
        var self = {
            get: _saveSelection,
            restore: _restoreSelection,
            html: _getSelectedHtml
        };

        return {
            $get: function () {
                if (window.getSelection && document.createRange) {
                    self = {
                        get: _saveSelection,
                        restore: _restoreSelection,
                        html: _getSelectedHtml
                    };
                } else if (document.selection) {
                    self = {
                        get: _saveMsSelection,
                        restore: _restoreMsSelection,
                        html: _getSelectedHtml
                    };
                }
                return self;
            }
        };

        function _saveSelection(container) {
            var range = window.getSelection().getRangeAt(0);
            var preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(container);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            var start = preSelectionRange.toString().length;

            return {
                start: start,
                end: start + range.toString().length
            };
        }

        function _restoreSelection(container, selection) {
            var charIndex = 0,
                range = document.createRange();

            range.setStart(container, 0);
            range.collapse(true);

            var nodeStack = [container],
                node,
                foundStart = false,
                stop = false,
                startNode;

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType === 3) {
                    var nextCharIndex = charIndex + node.length;
                    if (!foundStart && selection.start >= charIndex && selection.start < nextCharIndex) {
                        range.setStart(node, selection.start - charIndex);
                        startNode = node;
                        foundStart = true;
                    }
                    if (foundStart && selection.end > charIndex && selection.end <= nextCharIndex) {
                        range.setEnd(node, selection.end - charIndex);
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    var i = node.childNodes.length;
                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return startNode;
        }

        function _saveMsSelection(container) {
            var selectedTextRange = document.selection.createRange();
            var preSelectionTextRange = document.body.createTextRange();
            preSelectionTextRange.moveToElementText(container);
            preSelectionTextRange.setEndPoint('EndToStart', selectedTextRange);
            var start = preSelectionTextRange.text.length;

            return {
                start: start,
                end: start + selectedTextRange.text.length
            };
        }

        function _restoreMsSelection(container, selection) {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(container);
            textRange.collapse(true);
            textRange.moveEnd('character', selection.end);
            textRange.moveStart('character', selection.start);
            textRange.select();
        }

        function _getSelectedHtml(withParents) {
            var html = '',
                range,
                _container,
                _rootContainer;
            if (typeof window.getSelection !== 'undefined') {
                var sel = window.getSelection();
                if (sel.rangeCount) {
                    _rootContainer = document.createElement('div');
                    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                        range = sel.getRangeAt(i).cloneRange();
                        if (withParents) {
                            if (range.commonAncestorContainer === range.startContainer) {
                                _container = range.commonAncestorContainer.parentNode;
                            } else {
                                _container = range.commonAncestorContainer;
                                if (range.startContainer.parentNode.nodeName === 'LI') {
                                    range.startContainer.parentNode.setAttribute('value',
                                        _getLiIndex(range.startContainer.parentNode));
                                }
                            }
                            _container = _cloneParents(_container, _rootContainer);
                        } else {
                            _container = _rootContainer;
                        }
                        _container.appendChild(range.cloneContents());
                    }
                    html = _rootContainer.innerHTML;
                }
            } else if (typeof document.selection !== 'undefined') {
                if (document.selection.type === 'Text') {
                    html = document.selection.createRange().htmlText;
                }
            }
            return html;
        }

        function _cloneParents(node, container) {
            var _parents = [],
                _container,
                _node,
                _clone,
                q;

            _node = node;

            while (!(_node.nodeName === 'DIV' && ~_node.className.indexOf('ta-text')) &&
                _node.nodeName !== '#document') {
                _clone = _node.cloneNode(false);
                if (_clone.nodeName === 'LI') {
                    _clone.setAttribute('value', _getLiIndex(_node));
                }
                _parents.push(_clone);
                _node = _node.parentNode;
            }

            q = _parents.length;

            _container = container;
            for (; q--;) {
                _container = _container.appendChild(_parents[q]);
            }

            return _container;
        }

        function _getLiIndex(elemLi) {
            return elemLi.getAttribute('value') || angular.element(elemLi).index() + 1;
        }
    });
