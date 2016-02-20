/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersGroupsCtrl', function ($scope, greyscaleUsersGroupsTbl, greyscaleProfileSrv,
        greyscaleOrganizationApi, greyscaleGlobals) {

        var accessLevel;

        var userGroupsTable = greyscaleUsersGroupsTbl;

        $scope.model = {
            $loading: true
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
                userGroupsTable.dataFilter.organizationId = profile.organizationId;
                $scope.model.userGroups = userGroupsTable;
            }
        });

        $scope.organizationSelected = function () {
            if (!$scope.model.organizationId) {
                return;
            }

            userGroupsTable.dataFilter.organizationId = $scope.model.organizationId;

            if (!$scope.model.userGroups) {
                $scope.model.userGroups = userGroupsTable;
            } else {
                userGroupsTable.tableParams.reload();
            }
        };

        function _isSuperAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
        }
    });
