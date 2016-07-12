'use strict';

angular.module('greyscaleApp')
    .directive('fixedOnScroll', function ($timeout, $interval) {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var options = angular.extend({
                    padding: 0
                }, scope.$eval(attr.fixedOnScroll) || {});

                var w = angular.element(window);
                var fixedEl = angular.element(el.children()[0]);

                _setParams();
                $timeout(_setParams);

                w.on('scroll resize', _setParams);
                var height;
                var timer = $interval(function () {
                    if (height !== fixedEl.height()) {
                        _setHeight();
                    }
                }, 200);
                scope.$on('$destroy', function () {
                    w.off('scroll resize', _setParams);
                    $interval.clear(timer);
                });

                function _setParams() {
                    _setTop();
                    _setHeight();
                }

                function _setTop() {
                    var topOffset = el[0].getBoundingClientRect().top;
                    if (topOffset >= options.padding) {
                        topOffset = 0;
                    } else {
                        topOffset = -topOffset + options.padding;
                    }
                    fixedEl.css('top', topOffset);
                }

                function _getFixedElHeight() {
                    return fixedEl.height();
                }

                function _setHeight() {
                    var botOffset = fixedEl[0].getBoundingClientRect().bottom;
                    var topOffset = fixedEl[0].getBoundingClientRect().top;
                    fixedEl.height(window.innerHeight - topOffset - options.padding);
                }
            }
        };
    });
