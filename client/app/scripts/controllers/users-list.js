/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($scope, greyscaleUsersTbl, greyscaleModalsSrv) {

        var usersTable = greyscaleUsersTbl;

        $scope.model = {
            users: usersTable
        };

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, usersTable);
        };

    });
