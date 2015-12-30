/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($scope, greyscaleProjects, greyscaleEntityRoles, greyscaleEntityTypeSrv, _) {

        var prjRoles = angular.copy();


        var prjs = angular.copy(greyscaleProjects);

        prjs.pageLength = 5;

        $scope.model = {
            projects: greyscaleProjects,
            entRoles: greyscaleEntityRoles
        };


    });
