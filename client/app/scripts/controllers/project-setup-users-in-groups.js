'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupUsersInGroupsCtrl', function ($scope, greyscaleEntityRolesTbl, greyscaleProjectApi, $stateParams) {

        var entityRoles = greyscaleEntityRolesTbl;

        $scope.model = {
            entRoles: entityRoles
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (project) {
                entityRoles.dataFilter.entityId = project.id;
                entityRoles.dataFilter.organizationId = project.organizationId;
                entityRoles.tableParams.reload();
            });

    });
