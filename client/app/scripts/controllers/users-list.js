/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($rootScope, $scope, greyscaleUsersTbl, greyscaleModalsSrv, Organization) {

        var _usersTable = greyscaleUsersTbl;

        $scope.model = {
            users: _usersTable
        };

        Organization.$watch('id', $scope, _renderUsersTable);

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, _usersTable);
        };

        function _renderUsersTable() {
            _usersTable.dataFilter.organizationId = Organization.id;
            if ($scope.model.users.tableParams) {
                $scope.model.users.tableParams.reload();
            }
        }
    });
