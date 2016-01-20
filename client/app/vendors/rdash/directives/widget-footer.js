/**
 * Widget Footer Directive
 */
(function () {
    'use strict';
    angular.module('RDash')
        .directive('rdWidgetFooter', rdWidgetFooter);

    function rdWidgetFooter() {
        return {
            requires: '^rdWidget',
            transclude: true,
            template: '<div class="widget-footer" ng-transclude></div>',
            restrict: 'E'
        };
    }
})();
