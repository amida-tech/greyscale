/**
 * Widget Directive
 */
(function () {
    'use strict';
    angular.module('RDash')
        .directive('rdWidget', rdWidget);

    function rdWidget() {
        return {
            transclude: true,
            template: '<div class="widget" ng-transclude></div>',
            restrict: 'EA'
        };
    }
})();
