/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectsCtrl', function ($scope, greyscaleProjects, greyscaleEntityRoles) {
        var projects = greyscaleProjects;
        var entityRoles = greyscaleEntityRoles;

        $scope.model = {
            projects: projects,
            entRoles: entityRoles
        };

        $scope.projectSelect = function (row){
            if (typeof row !== 'undefined') {
                entityRoles.dataFilter.entityId= row.id;
                entityRoles.tableParams.reload();
            }
            return row;
        }
    });
