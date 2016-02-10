/**
 * Created by igi on 02.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersImportCtrl', function ($q, $scope, $state, $rootScope, greyscaleProfileSrv,
        greyscaleGlobals, greyscaleOrganizationApi, greyscaleImportUsersTbl) {

        var roles = greyscaleGlobals.userRoles;

        var _importUsers = greyscaleImportUsersTbl;

        $scope.model = {
            importUsers: _importUsers
        };

        greyscaleProfileSrv.getProfile()
            .then(function (profile) {
                $scope.model.organizationId = profile.organizationId;
            });

        greyscaleProfileSrv.getAccessLevel()
            .then(function (roleMask) {
                if (roleMask & roles.superAdmin.mask) {
                    greyscaleOrganizationApi.list().then(function (organizations) {
                        $scope.model.organizations = organizations;
                    });
                }
            });

        $scope.afterUpload = function (file, data) {
            _importUsers.dataPromise = function () {
                return $q.when(data);
            };
            if ($scope.model.results) {
                _importUsers.tableParams.reload();
            } else {
                $scope.model.results = true;
            }
        };

    });
