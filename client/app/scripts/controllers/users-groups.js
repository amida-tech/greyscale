'use strict';

angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, OrganizationSelector, greyscaleUsersGroupsTbl, greyscaleProjectApi, $stateParams) {

        var _userGroupsTable = greyscaleUsersGroupsTbl;

        OrganizationSelector.show = true;

        $scope.model = {
            userGroups: _userGroupsTable
        };

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
