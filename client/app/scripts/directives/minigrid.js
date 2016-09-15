'use strict';

angular.module('greyscaleApp')
    .directive('minigrid', function ($timeout, $window) {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {

                var _minigrid;

                var collection = attr.minigridCollection;
                if (collection) {
                    scope.$watchCollection(collection, function (v) {
                        if (v && v.length) {
                            $timeout(function () {
                                init();
                            });
                        }
                    });
                } else {
                    init();
                }
                angular.element($window).on('resize', _onResize);

                scope.$on('$destroy', function () {
                    angular.element($window).off('resize', _onResize);
                });

                function _onResize() {
                    init();
                }

                function init() {
                    _minigrid = new Minigrid({
                        skipWindowOnLoad: true,
                        container: el[0],
                        item: attr.minigridItem || '.card',
                        gutter: attr.minigrigGutter || 10
                    });
                    _minigrid.mount();
                }
            }
        };
    });
