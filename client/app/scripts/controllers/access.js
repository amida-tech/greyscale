/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, greyscaleRolesTbl, greyscaleRightsTbl, greyscaleRoleRightsTbl) {

        $scope.model = {
            roles: greyscaleRolesTbl,
            rights: greyscaleRightsTbl,
            roleRights: greyscaleRoleRightsTbl
        };

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                greyscaleRoleRightsTbl.dataFilter.role = role;
                greyscaleRoleRightsTbl.tableParams.reload();
            }
            return role;
        };
    });
