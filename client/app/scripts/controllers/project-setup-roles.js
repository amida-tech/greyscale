'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupRolesCtrl', function ($scope, greyscaleEntityRolesTbl, greyscaleProjectApi, $stateParams) {

        var entityRoles = greyscaleEntityRolesTbl;

        $scope.model = {
            entRoles: entityRoles
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (project) {
                entityRoles.dataFilter.entityId = project.id;
                entityRoles.tableParams.reload();
            });

    });
