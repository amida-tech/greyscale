/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, greyscaleRoles, greyscaleRights, greyscaleRoleRights) {

        $scope.model = {
            roles: greyscaleRoles,
            rights: greyscaleRights,
            roleRights: greyscaleRoleRights
        };

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                greyscaleRoleRights.dataFilter.role = role;
                greyscaleRoleRights.tableParams.reload();
            }
            return role;
        };
    });
