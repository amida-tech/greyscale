/**
 * Created by igi on 17.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyBlock', function ($log) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/policy-block.html',
            scope: {
                policyData: '=?'
            },
            link: function (scope) {
                scope.$watch('policyData', function (data) {
                    if (data) {
                        _refreshPolicy(scope, data);
                    }
                });
            }
        };

        function _refreshPolicy(scope, data) {
            $log.debug(data);
        }
    });
