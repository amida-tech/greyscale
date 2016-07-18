'use strict';
angular.module('greyscaleApp')
    .directive('searchPanel', function ($timeout, $window) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/search-panel.html',
            link: function (scope, el, attr) {
                var options = angular.extend({
                    btnSearch: 'COMMON.SEARCH'
                }, scope.$eval(attr.searchPanel));

                scope.empty = true;
                scope.gotResult = false;

                scope.search = _search;
                scope.next = _next;
                scope.prev = _prev;
                scope.clear = _clear;

                function _getContainers() {
                    var selector = scope.$eval(attr.searchSelector);
                    if (!selector) {
                        throw new Error('searchPanel required selector option');
                    }
                    return $(selector);
                }

                function _search() {
                    var input = scope.searchText;
                    var containers = _getContainers();
                    containers.each(function (i, el) {
                        _mark(el, input);
                    });
                    $timeout(_onFinish);
                }

                var current, result;

                function _onFinish() {
                    result = $('mark:not(.secondary)');
                    scope.gotResult = true;
                    scope.empty = !result.length;
                    _controlResult();
                }

                function _controlResult() {
                    if (!result.length) {
                        return;
                    }
                    current = 0;
                    _scrollTo(current);
                }

                function _scrollTo(index) {
                    scope.isFirst = index === 0;
                    scope.isLast = index === (result.length - 1);
                    scope.info = (current + 1) + ' / ' + result.length;
                    $('mark.active').removeClass('active');
                    var item = $(result[index]);
                    item.addClass('active');
                    $timeout(function () {
                        item.closest('.panel:not(.panel-open)').find('.accordion-toggle').click();
                        $timeout(function () {
                            var pos = item.offset().top;
                            angular.element($window).scrollTop(pos - 100);
                        }, 50);
                    });
                }

                function _next() {
                    current++;
                    if (current >= result.length) {
                        current = result.length - 1;
                        return;
                    }
                    _scrollTo(current);
                }

                function _prev() {
                    current--;
                    if (current < 0) {
                        current = 0;
                        return;
                    }
                    _scrollTo(current);
                }

                function _clear() {
                    _unmark();
                    scope.searchText = '';
                    scope.gotResult = false;
                }

                function _unmark() {
                    var containers = _getContainers();
                    containers.each(function (i, el) {
                        if (el.origHtml) {
                            el.innerHTML = el.origHtml;
                        }
                    });
                }

                function _mark(el, text) {
                    if (!el.origHtml) {
                        el.origHtml = el.innerHTML;
                    }
                    el.innerHTML = el.origHtml;

                    $(el).find('.Apple-converted-space').replaceWith(' ');

                    var htmlContent = $(el).html();

                    var textWords = text.split(' ');
                    var nrWords = textWords.length;
                    var startTag = '<mark>';
                    var endTag = '</mark>';
                    var regex, i;

                    if (nrWords === 1) {
                        regex = new RegExp(text + '(?=[^>]*?(<|$))', 'gi');
                    } else {
                        regex = textWords[0] + '(?=[^>]*?(<|$))';
                        for (i = 1; i < nrWords; i++) {
                            regex += '(?: ?)(?:<[^>]*?>)?(?: ?)' + textWords[i] + '(?=[^>]*?(<|$))';
                        }
                        regex = new RegExp(regex, 'gi');
                    }

                    var matches = null,
                        positions = [],
                        found = [],
                        addFoundChar = [];

                    while (matches = regex.exec(htmlContent), matches) {
                        var match = matches[0].replace(/>/g, '><mark class="secondary">');
                        match = match.replace(/<(?!mark>)/g, '</mark><');
                        found.push(match);
                        addFoundChar.push(match.length - matches[0].length);
                        positions.push(matches.index);
                    }

                    var addNrChars = 0;
                    var newHtmlContent = htmlContent;
                    for (i = 0; i < positions.length; i++) {
                        var contentBefore = newHtmlContent.substr(0, positions[i] + addNrChars);
                        var valueAndTags = startTag + found[i] + endTag;
                        var contentAfter = newHtmlContent.substr(positions[i] + addNrChars + found[i].length - addFoundChar[i]);
                        addNrChars += startTag.length + endTag.length + addFoundChar[i];
                        newHtmlContent = contentBefore + valueAndTags + contentAfter;
                    }

                    $(el).html(newHtmlContent);
                }

            }
        };
    });
