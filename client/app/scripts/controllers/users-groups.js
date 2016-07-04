'use strict';

angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, Organization, greyscaleGroupsTbl, greyscaleProjectApi, $stateParams) {

        var _groupsTable = greyscaleGroupsTbl;

        $scope.model = {
            groups: _groupsTable
        };

        Organization.$watch($scope, _renderUserGroupsTable);

        function _renderUserGroupsTable() {
            _groupsTable.dataFilter.organizationId = Organization.id;
            if ($scope.model.groups.tableParams) {
                $scope.model.groups.tableParams.reload();
            } else {
                $scope.model.groups = _groupsTable;
            }
        }
    });
