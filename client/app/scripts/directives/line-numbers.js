angular.module('greyscaleApp')
.directive('lineNumbers', paragraphNumbersDirective)
.directive('taBind', paragraphNumbersDirective);

function paragraphNumbersDirective(_, $timeout) {
    return {
        restrict: 'CA',
        link: function(scope, el, attr){
            // if (!el.is(':visible')) {
            //     return;
            // }

            var lineTags = ['P', 'LI',
                'H1', 'H2', 'H3', 'H4', 'H5',
            ];

            $timeout(function(){
                if ((attr.contenteditable && attr.taBind) || el.hasClass('line-numbers')) {
                    normalize(el[0]);
                    if (attr.contenteditable) {
                        el.on('input', function(){
                            normalize(el);
                        });
                    }
                    // el.contents().filter(function() {
                    //     console.log(this);
                    //     return this.nodeType == 3;  // Only text nodes
                    // }).wrap('<p class="numbered-line"></p>');
                    //el.filter('br').remove();
                    //el.html(_transform());
                }

            });

            function loopChildNodes(parentNode, fn) {
                if (!parentNode.childNodes || !parentNode.childNodes.length) {
                    return;
                }
                for (var i = 0; i < parentNode.childNodes.length; i++) {
                    var node = map[i];
                    fn(node);
                }
            }

            function normalize(parentNode, inLine) {
                loopChildNodes(parentNode.childNodes, function(node){
                    if (isText(node)) {
                        wrapNl(node);

                    } else if (!inLine && isLine(node)) {
                        node.isLine = true;
                        normalize(parentNode, false)
                    }
                });


                    // var textInDeepMap = nodeSearchDeep(this, function(n){
                    //     return n.nodeType === 3;
                    // });
                    //
                    // console.log(textInDeepMap);

                    // findLines(textInDeepMap);
                    // if (this.nodeType === 3) {
                    //     wrapNl(this);
                    // } else if (!nodeHasTextChildren(this)) {
                    //     normalize($(this));
                    // } else {
                    //     // } else if (!$this.hasClass('ln') &&
                    //     //     this.tagName !== 'LN' &&
                    //     //     !parentHasParentLn(this)) {
                    //     //     console.log('>>>>', $this.text(), ' === ' , $this.text() === '');
                    //     //     $this.addClass('ln');
                    //     // }
                    //     $this.addClass('ln');
                    // }
            }

            function findLines(map) {
                for (var i = 0; i < map.length; i++) {
                    console.log(map[i]);
                }
            }

            function nodeSearchDeep(node, criteria) {
                var match;
                var subMatches = [];
                var c = node.firstChild;
                do {
                    if (criteria(c)) {
                        match = c;
                    } else {
                        if (c.childNodes.length) {
                            var subMatch = nodeSearchDeep(c, criteria);
                            if ((subMatch && subMatch.nodeType) || (subMatch && subMatch.length)) {
                                subMatches.push(subMatch);
                            }
                        }
                    }
                } while (!match && (c = c.nextSibling));
                return match || (subMatches.length ? subMatches : null);
            }

            function isText(node) {
                return node.nodeType === 3 || node.textContent;
            }

            function isLine(node) {
                return lineTags.indexOf(node.tagName) >= 0 && node.childNodes.length;
            }

            /*
            .. search text/line(tag & children)
            .... is text -> wrap p.ln
            text
            .... is line -> search text/line
            <p>
              ....  line search, is text -> wrap ln
              text
              .... no text no line-> search text/line
              <ul>
                .... is line -> search text/line
                <li>
                  .... is text -> wrap p.ln
                  text
                </li>
                .... no text no line -> search text/line
                <li>
                  .... no text no line -> search text/line
                  <ul>
                    .... no text no line -> search text/line
                    <li>text</li>                 -> wrap
                    <li>text <b>text</b></li>
                  </ul>
                </li>
              </ul>
            </p>
            */

            /*


            */

            function getDeepTextParent(node) {
                var next = node.firstChild;
                var textParent;
                while (!textParent && next) {
                    if (nodeHasTextChildren(next)) {
                        textParent = next;
                    } else {

                    }
                }
                return textParent;
            }

            function nodeHasTextChildren(node) {
                var has = false;
                var c = node.firstChild;
                while (!has && c) {
                    if (c.nodeType === 3) {
                        has = true;
                    }
                    c = c.nextSibling;
                }
                return has;
            }

            function wrapNl(node) {
                if (node.textContent) {
                    node.className += ' nl';
                } else {
                    var parent = this.parentNode;
                    var wrapper = document.createElement('ln');
                    parent.replaceChild(wrapper, node);
                    wrapper.appendChild(node);
                }
            }

            function parentHasParentLn(node) {
                var parentNode = node.parentNode;
                var hasLn = false;
                while (!hasLn && parentNode) {
                    if (parentNode.hasLn || parentNode.tagName === 'LI' || $(parentNode).hasClass('ln')) {
                        hasLn = true;
                    }
                    parentNode = parentNode.parentNode;
                }
                return hasLn;
            }

            function _transform(html) {
                var transformedHtml = html;



                transformedHtml = html.replace(/^/gm, function() {
                   return '<div class="numbered-line"></div>';
                });

                transformedHtml = html.replace(/<br>/gm, function() {
                    return '<div class="numbered-line"></div>';
                });

                // if (html) {
                //     console.log('f');
                //     var htmlEl = angular.element('<div></div>').html(html);
                //     console.log(htmlEl.find('br,p'));
                //     htmlEl.find('br').addClass('numbered-line');
                //
                //     transformedHtml = htmlEl.html();
                // }

                return transformedHtml;
            }
        }
    };
}
