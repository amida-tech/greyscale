'use strict';

angular.module('greyscaleApp')
    .directive('hiddenSelect', function () {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var parent = el.parent();
                var position = parent.css('position');
                var relativePositions = ['absolute', 'relative', 'fixed'];
                if (!~relativePositions.indexOf(position)) {
                    parent.css('position', 'relative');
                }
                el.addClass('hidden-select');
            }
        };
    });
