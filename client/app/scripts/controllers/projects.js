/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($scope, $state, greyscaleProjectsTbl, greyscaleProfileSrv, greyscaleOrganizationApi, greyscaleGlobals) {

        var accessLevel;

        var projectsTable = greyscaleProjectsTbl;

        $scope.model = {
            $loading: true
        };

        $scope.projectSelect = function (row) {
            if (typeof row !== 'undefined') {
                $state.go('projects.setup', {
                    projectId: row.id
                });
            }
            return row;
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
                projectsTable.dataFilter.organizationId = profile.organizationId;
                $scope.model.projects = projectsTable;
            }
        });

        $scope.organizationSelected = function () {
            if (!$scope.model.organizationId) {
                return;
            }

            projectsTable.dataFilter.organizationId = $scope.model.organizationId;

            if (!$scope.model.projects) {
                $scope.model.projects = projectsTable;
            } else {
                projectsTable.tableParams.reload();
            }
        };

        function _isSuperAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
        }
    });
