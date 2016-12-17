/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($rootScope, $scope, $q, greyscaleUsersTbl, greyscaleModalsSrv, Organization, greyscaleGroupApi) {

        var _usersTable = greyscaleUsersTbl;

        $scope.model = {
            users: _usersTable
        };
        $scope.searchUsers = _searchUsers;

        Organization.$watch($scope, _renderUsersTable);

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, _usersTable);
        };

        function _renderUsersTable() {
            _usersTable.dataFilter.organizationId = Organization.id;
            var reqs = {
                groups: greyscaleGroupApi.list(Organization.id)
            };

            $q.all(reqs).then(function (promises) {
                $scope.model.groups = promises.groups;
            });

            if ($scope.model.users.tableParams) {
                $scope.model.users.tableParams.reload();
            }
        }

        function _searchUsers() {
            var searchGroupId = $scope.model.selectedGroup ?
                $scope.model.selectedGroup.id : null;

            $scope.model.users.groupID = searchGroupId;
            $scope.model.users.reloadTable();
        }
    });
