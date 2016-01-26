/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */
(function(){
    'use strict';
    angular.module('RDash')
        .directive('rdLoading', rdLoading);

    function rdLoading() {
        return {
            restrict: 'AE',
            template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
        };
    }
})();
