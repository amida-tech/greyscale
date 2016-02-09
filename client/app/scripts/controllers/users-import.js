/**
 * Created by igi on 02.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersImportCtrl', function ($scope, greyscaleProfileSrv,
        greyscaleGlobals, greyscaleOrganizationApi) {

        var roles = greyscaleGlobals.userRoles;

        $scope.model = {};

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

    });
