'use strict';

angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, Organization, greyscaleGroupsTbl, greyscaleProjectApi, $stateParams) {

        var _groupsTable = greyscaleGroupsTbl;

        $scope.model = {
            groups: _groupsTable
        };

        Organization.$watch($scope, _renderUserGroupsTable);

        function _renderUserGroupsTable() {
            if ($scope.model.groups) {
                $scope.model.groups.tableParams.reload();
            } else {
                $scope.model.groups = _groupsTable;
            }
        }
    });
