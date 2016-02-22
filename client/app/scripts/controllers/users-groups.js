/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($rootScope, $scope, greyscaleUsersGroupsTbl) {

        var _userGroupsTable = greyscaleUsersGroupsTbl;

        $scope.model = {};

        $rootScope.showOrganizationSelector = true;

        var off = $scope.$watch('globalModel.organization', _renderUserGroupsTable);

        $scope.$on('$destroy', function () {
            off();
            $rootScope.showOrganizationSelector = false;
        });

        function _renderUserGroupsTable(organization) {
            if (!organization) {
                return;
            }
            _userGroupsTable.dataFilter.organizationId = organization.id;
            if ($scope.model.userGroups) {
                $scope.model.userGroups.tableParams.reload();
            } else {
                $scope.model.userGroups = _userGroupsTable;
            }
        }

    });
