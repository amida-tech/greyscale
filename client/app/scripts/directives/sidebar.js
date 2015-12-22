/**
 * Created by igi on 09.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('sidebar', function ($log, $cookieStore) {
        return {
            templateUrl: 'views/directives/sidebar.html',
            scope: {
                toggle: '=',
                menu: '='
            },
            restrict: 'AE',
            link: function ($scope) {
                $log.debug('scope', $scope.menu);
                $scope.toggle = $cookieStore.get('toggle') || false;

                $scope.toggleSidebar = function () {
                    $scope.toggle = !$scope.toggle;
                    $cookieStore.put('toggle', $scope.toggle);
                };
            }
        };
    });
