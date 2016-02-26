'use strict';

angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, OrganizationSelector, greyscaleGroupsTbl, greyscaleProjectApi, $stateParams) {

        var _groupsTable = greyscaleGroupsTbl;

        OrganizationSelector.show = true;

        $scope.model = {
            groups: _groupsTable
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
            _groupsTable.dataFilter.organizationId = organization.id;
            if ($scope.model.groups) {
                $scope.model.groups.tableParams.reload();
            } else {
                $scope.model.groups = _groupsTable;
            }
        }
    });
