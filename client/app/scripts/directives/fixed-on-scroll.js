'use strict';

angular.module('greyscaleApp')
    .directive('fixedOnScroll', function(){
        return {
            restrict: 'A',
            link: function(scope, el, attr){

                var pos = el.css('position');
                if (!~['relative', 'absolute', 'fixed'].indexOf(pos)) {
                    el.css('position', 'relative');
                }

                var w = angular.element(window);

                var origY = el.offset().top;
                var origTop = parseInt(el.css('top'))||0;
                var topPadding = parseInt(attr.topPadding) || 0;

                w.on('scroll', _onScroll);

                scope.$on('$destroy', function(){
                    w.off('scroll', _onScroll);
                });

                function _onScroll(e) {
                    var scrollTop = w.scrollTop();
                    if (scrollTop === origTop) {
                        el.css('top', origTop);
                    } else if (scrollTop > (origY - topPadding)) {
                        el.css('top', origTop + (scrollTop - origY + topPadding));
                    }
                }
            }
        };
    });
