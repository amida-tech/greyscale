/**
 * Created by igi on 02.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersImportCtrl', function ($q, $scope, greyscaleUsersImportTbl) {

        var _usersImportTable = greyscaleUsersImportTbl;

        $scope.model = {};

        var off = $scope.$watch('tabsModel.organizationId', _renderUsersImportTable);

        $scope.$on('$destroy', function(){
            off();
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

        function _renderUsersImportTable(organizationId) {
            if (!organizationId) {
                return;
            }
            _usersImportTable.dataFilter.organizationId = organizationId;
            if ($scope.model.importUsers) {
                $scope.model.importUsers.tableParams.reload();
            } else {
                $scope.model.importUsers = _usersImportTable;
            }
        }

    });
