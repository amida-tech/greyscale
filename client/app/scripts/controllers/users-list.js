/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($scope, greyscaleUsersTbl, greyscaleModalsSrv) {

        var _usersTable = greyscaleUsersTbl;

        $scope.model = {};

        var off = $scope.$watch('tabsModel.organizationId', _renderUsersTable);

        $scope.$on('$destroy', function(){
           off();
        });

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, _usersTable);
        };

        function _renderUsersTable(organizationId) {
            if (!organizationId) {
                return;
            }
            _usersTable.dataFilter.organizationId = organizationId;
            if ($scope.model.users) {
                $scope.model.users.tableParams.reload();
            } else {
                $scope.model.users = _usersTable;
            }
        }
    });
