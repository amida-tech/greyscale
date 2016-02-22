/**
 * Created by igi on 02.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersImportCtrl', function ($rootScope, $q, $scope, greyscaleUsersImportTbl) {

        var _usersImportTable = greyscaleUsersImportTbl;

        $scope.model = {};

        $rootScope.showOrganizationSelector = true;

        var off = $scope.$watch('globalModel.organization', _renderUsersImportTable);

        $scope.$on('$destroy', function () {
            off();
            $rootScope.showOrganizationSelector = false;
        });

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

        function _renderUsersImportTable(organization) {
            if (!organization) {
                return;
            }
            _usersImportTable.dataFilter.organizationId = organization.id;
            if ($scope.model.importUsers) {
                $scope.model.importUsers.tableParams.reload();
            } else {
                $scope.model.importUsers = _usersImportTable;
            }
        }

    });
