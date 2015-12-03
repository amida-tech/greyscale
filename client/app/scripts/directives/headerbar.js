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
                $scope.model = {
                    toggle: $cookieStore.get('toggle') || false,
                    alerts: [],
                    title: 'Title'
                };

                $scope.toggleSidebar = function() {
                    $scope.model.toggle = !$scope.model.toggle;
                    $cookieStore.put('toggle', $scope.model.toggle);
                };

                $scope.logout = function () {
                    greyscaleAuthSrv.logout();
                };

                $scope.closeAlert = function(index) {
                    $scope.model.alerts.splice(index, 1);
                };
            }
        };
    });
