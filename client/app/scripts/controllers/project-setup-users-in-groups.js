'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupUsersInGroupsCtrl', function ($scope, greyscaleUsersUserGroupsTbl, greyscaleProjectApi, $stateParams) {

        var projectId = $stateParams.projectId;

        var usersUserGroups = greyscaleUsersUserGroupsTbl;

        $scope.model = {
            usersUserGroups: usersUserGroups
        };

        greyscaleProjectApi.get(projectId)
            .then(function (project) {
                usersUserGroups.dataFilter.projectId = project.id;
                usersUserGroups.dataFilter.organizationId = project.organizationId;
                usersUserGroups.tableParams.reload();
            });

    });
