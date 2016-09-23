angular.module('greyscaleApp')
    .directive('lineNumbers', paragraphNumbersDirective)
    .directive('taBind', paragraphNumbersDirective);

function paragraphNumbersDirective(_, $timeout) {
    return {
        restrict: 'CA',
        link: function (scope, el, attr) {

            var lineTags = [
                'P', 'LI',
                'H1', 'H2', 'H3', 'H4', 'H5',
                'TR'
            ];

            var textTags = [
                'FONT', 'B', 'I', 'U', 'STRONG'
            ];

            var ln = 'ln';

            $timeout(function () {
                if ((attr.contenteditable && attr.taBind) || el.hasClass('line-numbers')) {
                    _setLineNumbers(el[0]);
                    if (attr.contenteditable) {
                        el.closest('text-angular').on('input click paste cut', function () {
                            _setLineNumbers(el[0]);
                        });
                    }
                    scope.$on('line-numbers-refresh', function () {
                        _setLineNumbers(el[0]);
                    });
                }
            });

            function _setLineNumbers(parentNode, insideLine) {
                _loopChildNodes(parentNode, function (node) {
                    var _node = angular.element(node);
                    if (_isEmpty(node)) {
                        if (!_node.html()) {
                            _node.remove();
                        }
                        return;
                    }

                    var isText = _isText(node);
                    var isLine = _isLine(node);
                    var hasTextChild = _hasTextChild(node);
                    var hasLineChild = _hasLineChild(node);
                    var hasDeepLineChild = _hasDeepLineChild(node);
                    var isTable = node.nodeName === 'TABLE';

                    if (isText) {
                        if (!insideLine) {
                            _setLn(node);
                        }
                    } else if (isTable) {
                        $(node).find('tr:not(.ln)').addClass(ln);
                    } else if (hasDeepLineChild) {
                        _node.removeClass(ln);
                        if (hasTextChild && !hasLineChild) {
                            _setLn(node);
                        }
                        _setLineNumbers(node, hasTextChild && !hasLineChild);
                    } else if (isLine && hasTextChild) {
                        if (!insideLine) {
                            _setLn(node);
                        }
                        _setLineNumbers(node, true);
                    }
                });
            }

            function _isEmpty(node) {
                return !angular.element(node).text();
            }

            function _isText(node) {
                return node.nodeType === 3 || (!_isLine(node) &&
                    ($(node).text() === $(node).html() || textTags.indexOf(node.nodeName) >= 0));
            }

            function _isLine(node) {
                return lineTags.indexOf(node.nodeName) >= 0;
            }

            function _hasDeepLineChild(node) {
                var has = false;
                _loopChildNodes(node, function (n) {
                    if (!has && (n.nodeName === 'BR' || (_isLine(n) || _hasDeepLineChild(n)))) {
                        has = true;
                    }
                    if (n.nodeName === 'BR') {
                        n.remove();
                    }

                });
                return has;
            }

            function _hasLineChild(node) {
                var has = false;
                _loopChildNodes(node, function (n) {
                    if (!has && (n.nodeName === 'BR' || _isLine(n))) {
                        has = true;
                    }
                    if (n.nodeName === 'BR') {
                        n.remove();
                    }

                });
                return has;
            }

            function _hasTextChild(node) {
                var has = false;
                _loopChildNodes(node, function (n) {
                    if (!has && (_isText(n))) {
                        has = true;
                    }
                });
                return has;
            }

            function _setLn(node) {
                var _node = angular.element(node);
                if (node.nodeType === 3) {
                    var parent = node.parentNode;
                    var wrapper = document.createElement('p');
                    wrapper.className += ln;
                    parent.replaceChild(wrapper, node);
                    wrapper.appendChild(node);
                } else if (_isLine(node) && !_node.hasClass(ln)) {
                    _node.addClass(ln);
                }
            }

            function _loopChildNodes(parentNode, fn) {
                var nodes = parentNode.childNodes;
                if (!nodes || !nodes.length) {
                    return;
                }
                for (var i = 0; i < nodes.length; i++) {
                    fn(nodes[i]);
                }
            }
        }
    };
}
