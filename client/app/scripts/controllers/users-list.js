/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersListCtrl', function ($scope, greyscaleProfileSrv, greyscaleUsersTbl, greyscaleOrganizationApi, greyscaleModalsSrv, greyscaleGlobals) {

        var accessLevel;

        var usersTable = greyscaleUsersTbl;

        $scope.model = {
            $loading: true
        };

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, usersTable);
        };

        greyscaleProfileSrv.getProfile().then(function (profile) {

            accessLevel = greyscaleProfileSrv.getAccessLevelMask();

            if (_isSuperAdmin()) {
                greyscaleOrganizationApi.list().then(function (organizations) {
                    $scope.model.$loading = false;
                    $scope.model.organizations = organizations;
                });
            } else {
                $scope.model.$loading = false;
                usersTable.dataFilter.organizationId = profile.organizationId;
                $scope.model.users = usersTable;
            }
        });

        $scope.organizationSelected = function () {
            if (!$scope.model.organizationId) {
                return;
            }

            usersTable.dataFilter.organizationId = $scope.model.organizationId;

            if (!$scope.model.users) {
                $scope.model.users = usersTable;
            } else {
                usersTable.tableParams.reload();
            }
        };

        function _isSuperAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
        }
    });
