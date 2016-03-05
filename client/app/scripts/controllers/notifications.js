'use strict';
angular.module('greyscaleApp')
    .controller('NotificationsCtrl', function ($rootScope, $scope, greyscaleNotificationsTbl) {

        var _table = greyscaleNotificationsTbl;

        $scope.model = {
            notifications: _table
        };

    });
