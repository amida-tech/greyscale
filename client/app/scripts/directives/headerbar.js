/**
 * Created by igi on 09.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('headerbar',function(){
        return {
            templateUrl: 'views/directives/headerbar.html',
            toggle: '=',
            restrict: 'AE',
            controller: function($scope, $cookieStore, greyscaleAuthSrv) {
                $scope.toggle = $cookieStore.get('toggle') || false;

                $scope.toggleSidebar = function() {
                    $scope.toggle = !$scope.toggle;
                    $cookieStore.put('toggle', $scope.toggle);
                };

                $scope.logout = function () {
                    greyscaleAuthSrv.logout();
                }

            }
        }
    });
