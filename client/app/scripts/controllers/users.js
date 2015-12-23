/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersCtrl', function ($scope, greyscaleUsers) {
        $scope.model = {
            users: greyscaleUsers
        };
    });
