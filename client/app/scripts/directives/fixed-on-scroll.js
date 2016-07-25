'use strict';

angular.module('greyscaleApp')
    .directive('fixedOnScroll', function ($timeout, $interval) {
        return {
            restrict: 'A',
            scope: {
                active: '='
            },
            link: function (scope, el, attr) {
                var options = angular.extend({
                    fitHeight: false,
                    padding: 0
                }, scope.$eval(attr.fixedOnScroll) || {});

                var w = angular.element(window);
                var fixedEl = angular.element(el.children()[0]);

                _setParams();
                $timeout(_setParams);

                w.on('scroll resize', _setParams);

                if (options.fitHeight) {
                    var height;
                    var timer = $interval(function () {
                        if (height !== fixedEl.height()) {
                            _setHeight();
                        }
                    }, 200);
                }

                var stopWatchActive = scope.$watch('active', _setParams);

                scope.$on('$destroy', function () {
                    w.off('scroll resize', _setParams);
                    $interval.cancel(timer);
                    stopWatchActive();
                });

                function _setParams() {
                    _setTop();
                    _setHeight();
                }

                function _setTop() {
                    var topOffset;
                    if (scope.active === undefined || scope.active) {
                        topOffset = el[0].getBoundingClientRect().top;
                        if (topOffset >= options.padding) {
                            topOffset = 0;
                            el.removeClass('is-fixed-on-scroll');
                        } else {
                            topOffset = -topOffset + options.padding;
                            el.addClass('is-fixed-on-scroll');
                        }
                    } else {
                        topOffset = 0;
                        el.removeClass('is-fixed-on-scroll');
                    }

                    fixedEl.css('top', topOffset);
                }

                function _getFixedElHeight() {
                    return fixedEl.height();
                }

                function _setHeight() {
                    if (!options.fitHeight) {
                        return;
                    }
                    var botOffset = fixedEl[0].getBoundingClientRect().bottom;
                    var topOffset = fixedEl[0].getBoundingClientRect().top;
                    fixedEl.height(window.innerHeight - topOffset - options.padding);
                }
            }
        };
    });
