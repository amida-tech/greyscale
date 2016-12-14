'use strict';
angular.module('greyscaleApp')
    .controller('NotificationsCtrl', function ($rootScope, $scope, greyscaleNotificationsTbl, greyscaleAllNotificationsTbl) {

        var _myTable = greyscaleNotificationsTbl;
        var _allTable = greyscaleAllNotificationsTbl;

        $scope.model = {
            myNotifications: _myTable,
            allNotifications: _allTable
        };

    });
