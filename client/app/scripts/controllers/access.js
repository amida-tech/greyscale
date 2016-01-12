/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, greyscaleRoles, greyscaleRights, greyscaleRoleRights) {

        var _reloadRoleRights = function() {
            $scope.model.roleRights.tableParams.reload();
        };

        $scope.model = {
            roles: greyscaleRoles,
            rights: greyscaleRights,
            roleRights: greyscaleRoleRights({
                getRole: function () {
                    return $scope.model.roles.current;
                },
                onUpdate: _reloadRoleRights
            })
        };

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                _reloadRoleRights();
            }
            return role;
        };
    });
