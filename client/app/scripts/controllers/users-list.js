/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($scope, greyscaleUsersTbl) {
        $scope.model = {
            users: greyscaleUsersTbl
        };
    });
