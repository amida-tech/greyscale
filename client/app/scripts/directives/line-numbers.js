angular.module('greyscaleApp')
.directive('lineNumbers', paragraphNumbersDirective)
.directive('taBind', paragraphNumbersDirective);

function paragraphNumbersDirective(_, $timeout) {
    return {
        restrict: 'CA',
        link: function(scope, el, attr){

            var lineTags = [
                'P', 'LI',
                'H1', 'H2', 'H3', 'H4', 'H5',
                'TR'
            ];

            var textTags = [
                'FONT', 'B', 'I', 'U', 'strong'
            ];

            $timeout(function(){
                if ((attr.contenteditable && attr.taBind) || el.hasClass('line-numbers')) {
                    _setLineNumbers(el[0]);
                    if (attr.contenteditable) {
                        el.closest('text-angular').on('input click paste cut', function(){
                            _setLineNumbers(el[0]);
                        });
                    }
                    scope.$on('line-numbers-refresh', function(){
                        _setLineNumbers(el[0]);
                    });
                }

            });

            function _setLineNumbers(parentNode, insideLine) {
                _loopChildNodes(parentNode, function(node){
                    if (_isEmpty(node)) {
                        return;
                    }
                    var isText = _isText(node);
                    var isLine = _isLine(node);
                    var hasTextChild = _hasTextChild(node);
                    var hasLineChild = _hasLineChild(node);
                    var hasDeepLineChild = _hasDeepLineChild(node);
                    var isTable = node.tagName === 'TABLE';
                    if (isText) {
                        if (!insideLine) {
                            _setLn(node);
                        }

                    } else if (isTable) {
                        $(node).find('tr:not(.ln)').addClass('ln');

                    } else if (hasDeepLineChild) {
                        if (hasTextChild) {
                            _setLn(node);
                        }
                        _setLineNumbers(node, !hasLineChild);

                    } else if (isLine && hasTextChild) {
                        if (!insideLine) {
                            _setLn(node);
                        }
                        _setLineNumbers(node, true);
                    }
                });
            }

            function _isEmpty(node) {
                return $(node).text() === '';
            }

            function _isText(node) {
                return node.nodeType === 3 || (!_isLine(node) &&
                    ($(node).text() === $(node).html() || textTags.indexOf(node.tagName) >= 0));
            }

            function _isLine(node) {
                return lineTags.indexOf(node.tagName) >= 0;
            }

            function _hasDeepLineChild(node) {
                var has = false;
                _loopChildNodes(node, function(n) {
                    if (!has && (n.tagName === 'BR' || (_isLine(n) || _hasDeepLineChild(n)))) {
                        has = true;
                    }
                    if (n.tagName === 'BR') {
                        n.remove();
                    }

                });
                return has;
            }

            function _hasLineChild(node) {
                var has = false;
                _loopChildNodes(node, function(n) {
                    if (!has && (n.tagName === 'BR' || _isLine(n))) {
                        has = true;
                    }
                    if (n.tagName === 'BR') {
                        n.remove();
                    }

                });
                return has;
            }

            function _hasTextChild(node) {
                var has = false;
                _loopChildNodes(node, function(n){
                    if (!has && (_isText(n))) {
                        has = true;
                    }
                });
                return has;
            }

            function _setLn(node) {
                if (node.nodeType === 3) {
                    var parent = node.parentNode;
                    var wrapper = document.createElement('p');
                    wrapper.className += 'ln';
                    parent.replaceChild(wrapper, node);
                    wrapper.appendChild(node);
                } else if (_isLine(node) && !$(node).hasClass('ln')) {
                    $(node).addClass('ln');
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
