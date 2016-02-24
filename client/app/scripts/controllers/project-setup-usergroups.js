'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupUserGroupsCtrl', function ($scope, greyscaleProjectUserGroupsTbl, greyscaleProjectApi, $stateParams) {

        var projectId = $stateParams.projectId;

        var usergroups = greyscaleProjectUserGroupsTbl;
        usergroups.dataFilter.projectId = projectId;

        $scope.model = {
            usergroups: usergroups
        };
    });
