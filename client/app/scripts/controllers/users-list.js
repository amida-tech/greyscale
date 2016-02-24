/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($rootScope, $scope, greyscaleUsersTbl, greyscaleModalsSrv, OrganizationSelector) {

        var _usersTable = greyscaleUsersTbl;

        $scope.model = {};

        OrganizationSelector.show = true;

        var off = $scope.$watch('OrganizationSelector.organization', _renderUsersTable);

        $scope.$on('$destroy', function () {
            off();
            OrganizationSelector.show = false;
        });

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, _usersTable);
        };

        function _renderUsersTable(organization) {
            if (!organization) {
                return;
            }
            _usersTable.dataFilter.organizationId = organization.id;
            if ($scope.model.users) {
                $scope.model.users.tableParams.reload();
            } else {
                $scope.model.users = _usersTable;
            }
        }
    });
