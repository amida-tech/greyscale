'use strict';
angular.module('greyscale.wysiwyg')
    .directive('textAngularToolbar', function ($window, $log) {
        return {
            link: _link
        };

        function _link(scope, el) {
            $log.debug('taToolbar ', el);
            var stop = scope.$watch(_detectFocus(el), _toggleExtendedMode(el));
            scope.$on('$destroy', function () {
                stop();
                _stopControlPosition(el);
            });

            angular.element($window).bind('scroll', function(){
                $log.debug($window);
            })
        }

        function _detectFocus(el) {
            return function () {
                return el.hasClass('focussed');
            };
        }

        function _toggleExtendedMode(el) {
            return function (activate) {
                $log.debug('taToolbar extended mode', el, activate);
                _toggleControlPosition(el, activate);
            };
        }

        function _toggleControlPosition(el, active) {
            if (!active) {
                _stopControlPosition(el);
            } else {
                _startControlPosition(el);
            }
        }

        function _stopControlPosition(el) {
            if (el.stopControlPosition) {
                el.stopControlPosition();
                el.stopControlPosition = undefined;
                el.css('top', 0);
            }
        }

        function _startControlPosition(el) {
            el.stopControlPosition = _controlPosition(el);
        }

        function _controlPosition(el) {
            var prev;
            var setOffset = function () {
                var offset = _getToolbarOffset(el);
                if (prev !== offset) {
                    prev = offset;
                    el.css('top', offset);
                }
            };

            setOffset();
            angular.element($window).on('scroll', setOffset);
            return function () {
                angular.element($window).off('scroll', setOffset);
            };
        }

        function _getToolbarOffset(el) {
            var offset = _findViewportOffset(el[0].parentNode);
            offset = offset < 0 ? -offset : 0;
            offset = (offset >= el.next().height()) ? 0 : offset;
            return offset;
        }

        function _findViewportOffset(node) {
            var viewportOffset = 0;
            $log.debug(node, $window.scrollY);
            if (node.offsetParent) {
                do {
                    viewportOffset += node.offsetTop;
                    node = node.offsetParent;
                } while (node);
            }
            return viewportOffset - $window.scrollY;
        }
    });
