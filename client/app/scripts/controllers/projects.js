/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($scope, $state, greyscaleProjectsTbl) {
        var projects = greyscaleProjectsTbl;

        $scope.model = {
            projects: projects,
        };

        $scope.projectSelect = function (row) {
            if (typeof row !== 'undefined') {
                $state.go('projects.setup', {
                    projectId: row.id
                });
            }
            return row;
        };
    });
