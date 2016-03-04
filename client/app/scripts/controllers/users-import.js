/**
 * Created by igi on 02.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersImportCtrl', function ($rootScope, $q, $scope, greyscaleUsersImportTbl, Organization) {

        var _usersImportTable = greyscaleUsersImportTbl;

        $scope.model = {
            importResults: false
        };

        Organization.$watch($scope, _renderUsersImportTable);

        $scope.afterUpload = function (file, data) {
            _usersImportTable.dataPromise = function () {
                return $q.when(data);
            };

            if ($scope.model.importResults) {
                $scope.model.importUsers.tableParams.reload();
            } else {
                $scope.model.importResults = true;
            }
        };

        function _renderUsersImportTable() {
            $scope.model.organization = Organization;
            _usersImportTable.dataFilter.organizationId = Organization.id;
            if ($scope.model.importUsers && $scope.model.importUsers.tableParams) {
                $scope.model.importUsers.tableParams.reload();
            } else {
                $scope.model.importUsers = _usersImportTable;
            }
        }

    });
