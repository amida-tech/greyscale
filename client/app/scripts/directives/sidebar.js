/**
 * Created by igi on 09.11.15.
 */
"use strict";

angular.module('greyscaleClientApp')
    .directive('sidebar',function(){
        return {
            templateUrl: 'views/directives/sidebar.html',
            toggle: '=',
            restrict: 'AE',
            controller: function($scope, $cookieStore) {
                $scope.toggle = $cookieStore.get('toggle') || false;

                $scope.toggleSidebar = function() {
                    $scope.toggle = !$scope.toggle;
                    $cookieStore.put('toggle', $scope.toggle);
                };

            }
        }
    });
