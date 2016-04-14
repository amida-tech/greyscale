/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('sidebar', function ($cookies) {
        return {
            templateUrl: 'views/directives/sidebar.html',
            scope: {
                toggle: '=',
                menu: '='
            },
            restrict: 'AE',
            link: function ($scope) {
                $scope.toggle = !!$cookies.get('toggle');

                $scope.toggleSidebar = function () {
                    $scope.toggle = !$scope.toggle;
                    $cookies.put('toggle', $scope.toggle);
                };
            }
        };
    });
