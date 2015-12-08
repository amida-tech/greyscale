/**
 * Created by igi on 08.12.15.
 */
'use strict';
angular.module('greyscaleApp')
.controller('DashboardHeaderCtrl',function($scope, $state, $log, greyscaleAuthSrv){
        $scope.logout = function () {
            greyscaleAuthSrv.logout();
        };
    });
