'use strict';

angular.module('greyscaleApp')
.controller('ProjectSetupRolesCtrl', function ($scope, greyscaleEntityRoles, greyscaleProjectSrv, $stateParams) {

    var entityRoles = greyscaleEntityRoles;

    $scope.model = {
        entRoles: entityRoles
    };

    greyscaleProjectSrv.get($stateParams.projectId)
    .then(function (project) {
        entityRoles.dataFilter.entityId = project.id;
        entityRoles.tableParams.reload();
    });

});
