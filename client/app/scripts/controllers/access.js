/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, greyscaleRolesTbl, greyscaleRightsTbl, greyscaleRoleRightsTbl, Organization) {

        $scope.model = {
            rights: greyscaleRightsTbl,
            roleRights: greyscaleRoleRightsTbl,
            roles: greyscaleRolesTbl
        };

        Organization.$watch($scope, _renderAccessTables)

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                greyscaleRoleRightsTbl.dataFilter.role = role;
                greyscaleRoleRightsTbl.tableParams.reload();
            }
            return role;
        };

        function _renderAccessTables() {
            $scope.model.roleRights.dataFilter.role = null;
            _reloadTable($scope.model.rights);
            _reloadTable($scope.model.roleRights);
            _reloadTable($scope.model.roles);
        }

        function _reloadTable(table) {
            if (table && table.tableParams) {
                table.tableParams.reload();
            }
        }
    });
