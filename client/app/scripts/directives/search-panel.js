'use strict';
angular.module('greyscaleApp')
    .directive('searchPanel', function ($timeout, $window) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/search-panel.html',
            link: function (scope, el, attr) {
                var options = angular.extend({
                    selector: 'body',
                    btnSearch: 'COMMON.SEARCH'
                }, scope.$eval(attr.searchPanel));

                var search = new window.Hilitor({
                    onFinish: _onFinish,
                    colors: ['#ff6']
                });

                scope.gotResult = false;

                scope.search = _search;
                scope.next = _next;
                scope.prev = _prev;
                scope.clear = _clear;

                function _search(matchType) {
                    var text = scope.searchText;
                    search.setMatchType(matchType);
                    search.apply(angular.element(options.selector), text);
                }

                var current, result;

                function _onFinish() {
                    result = $('em.hilitor');
                    scope.gotResult = true;
                    scope.empty = !result.length
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
                    $('.hilitor.current').removeClass('current');
                    var item = $(result[index]);
                    item.addClass('current');
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
                    search.remove();
                    scope.searchText = '';
                    scope.gotResult = false;
                }
            }
        };
    });
