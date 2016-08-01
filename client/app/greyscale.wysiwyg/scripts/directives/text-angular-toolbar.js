'use strict';
angular.module('greyscale.wysiwyg')
    .directive('textAngularToolbar', function ($window) {
        return {
            link: _link
        };

        function _link(scope, el) {
            var stop = scope.$watch(_detectFocus(el), _toggleExtendedMode(el));
            scope.$on('$destroy', function () {
                stop();
                _stopControlPosition(el);
            });
        }

        function _detectFocus(el) {
            return function () {
                return el.hasClass('focussed');
            };
        }

        function _toggleExtendedMode(el) {
            return function (activate) {
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
                var offset = _getToolbarOffsetY(el, el[0].parentNode);
                if (prev !== offset) {
                    prev = offset;
                    el.css('top', offset);
                }
            };

            setOffset();

            $window.document.addEventListener('scroll', setOffset);
            return function () {
                $window.document.removeEventListener('scroll', setOffset);
            };
        }

        function _getToolbarOffsetY(el, container) {
            var _eBox = container.getBoundingClientRect();
            var offset = _eBox.top;
            offset = offset < 0 ? -offset : 0;
            offset = (offset >= el.next().height()) ? 0 : offset;
            return offset;
        }
    });
