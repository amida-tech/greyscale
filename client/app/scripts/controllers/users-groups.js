/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($rootScope, $scope, greyscaleUsersGroupsTbl, OrganizationSelector) {

        var _userGroupsTable = greyscaleUsersGroupsTbl;

        $scope.model = {};

        OrganizationSelector.show = true;

        var off = $scope.$watch('OrganizationSelector.organization', _renderUserGroupsTable);

        $scope.$on('$destroy', function () {
            off();
            OrganizationSelector.show = false;
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
