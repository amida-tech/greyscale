/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($rootScope, $scope, $state, greyscaleProjectsTbl, OrganizationSelector) {

        var _projectsTable = greyscaleProjectsTbl;

        $scope.model = {};

        OrganizationSelector.show = true;

        var off = $scope.$watch('OrganizationSelector.organization', _renderProjectsTable);

        $scope.$on('$destroy', function () {
            off();
            OrganizationSelector.show = false;
        });

        $scope.projectSelect = function (row) {
            if (typeof row !== 'undefined') {
                $state.go('projects.setup', {
                    projectId: row.id
                });
            }
            return row;
        };

        function _renderProjectsTable(organization) {
            if (!organization) {
                return;
            }
            _projectsTable.dataFilter.organizationId = organization.id;
            if ($scope.model.projects) {
                $scope.model.projects.tableParams.reload();
            } else {
                $scope.model.projects = _projectsTable;
            }
        }

    });
