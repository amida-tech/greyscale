/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($rootScope, $scope, $state, greyscaleProjectsTbl, Organization) {

        var _projectsTable = greyscaleProjectsTbl;

        $scope.model = {};

        console.log(Organization);

        Organization.$watch($scope, _renderProjectsTable);

        $scope.projectSelect = function (row) {
            if (typeof row !== 'undefined') {
                $state.go('projects.setup', {
                    projectId: row.id
                });
            }
            return row;
        };

        function _renderProjectsTable() {
            _projectsTable.dataFilter.organizationId = Organization.id;
            if ($scope.model.projects) {
                $scope.model.projects.tableParams.reload();
            } else {
                $scope.model.projects = _projectsTable;
            }
        }

    });
