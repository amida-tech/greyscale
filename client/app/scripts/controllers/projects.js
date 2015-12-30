/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($scope, greyscaleProjects, greyscaleEntityRoles) {
        $scope.model = {
            projects: greyscaleProjects,
            entRoles: greyscaleEntityRoles
        };
    });
