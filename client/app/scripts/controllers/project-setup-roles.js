'use strict';

angular.module('greyscaleApp')
.controller('ProjectSetupRolesCtrl', function ($scope, greyscaleEntityRoles, greyscaleProjectApi, $stateParams) {

    var entityRoles = greyscaleEntityRoles;

    $scope.model = {
        entRoles: entityRoles
    };

    greyscaleProjectApi.get($stateParams.projectId)
    .then(function (project) {
        entityRoles.dataFilter.entityId = project.id;
        entityRoles.tableParams.reload();
    });

});
