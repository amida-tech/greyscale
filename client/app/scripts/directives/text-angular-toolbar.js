'use strict';
angular.module('greyscaleApp')
.directive('textAngularToolbar', function ($window,$document) {
    return {
        link: _link
    };

    function _link(scope, el) {
        var stop = scope.$watch(_detectFocus(el), _toggleExtendedMode(el));
        scope.$on('$destroy', function(){
           stop();
           _stopControlPosition(el);
        });
    }

    function _detectFocus(el) {
        return function(){
            return el.hasClass('focussed');
        }
    }

    function _toggleExtendedMode(el) {
        return function(activate){
            if (activate) {
                el.addClass('fixed');
            } else {
                el.removeClass('fixed');
            }
            _controlPosition(el, activate);
        }
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
        }
    }

    function _startControlPosition(el) {
        el.stopControlPosition = _controlPosition(el);
    }

    function _controlPosition(el) {
        var window = angular.element($window);
        var detectOutOfScreenFn = _detectOutOfScreen(el);
        var toggleModeFn = _toggleMode(el);
        var stopWatch = el.scope().$watch(detectOutOfScreenFn, toggleModeFn)
        var scrollHandler = function(){
            toggleModeFn(detectOutOfScreenFn());
        };
        window.bind('scroll', scrollHandler);
        return function() {
            stopWatch();
            window.unbind('scroll', scrollHandler);
        }
    }

    function _detectOutOfScreen(el) {
        return function(){
            console.log($document.scrollTop);
        }
    }

    function _toggleMode(el) {
        return function(on){

        }
    }
});
