/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, greyscaleUsersGroupsTbl) {

        var _userGroupsTable = greyscaleUsersGroupsTbl;

        $scope.model = {};

        var off = $scope.$watch('tabsModel.organizationId', _renderUserGroupsTable);

        $scope.$on('$destroy', function(){
            off();
        });

        function _renderUserGroupsTable(organizationId) {
            if (!organizationId) {
                return;
            }
            _userGroupsTable.dataFilter.organizationId = organizationId;
            if ($scope.model.userGroups) {
                $scope.model.userGroups.tableParams.reload();
            } else {
                $scope.model.userGroups = _userGroupsTable;
            }
        }

    });
